import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';

// データベースの定義
const db = new Dexie('asaRakuDatabase_v4');
db.version(1).stores({
  clothes: '++id, category, memo, image, color' 
});

function App() {
  // --- 登録用の状態 ---
  const [category, setCategory] = useState('トップス');
  const [memo, setMemo] = useState('');
  const [color, setColor] = useState('白');
  const [imageSrc, setImageSrc] = useState(null);
  
  // --- 検索用の状態 ---
  const [searchCategory, setSearchCategory] = useState('すべて');
  const [searchWord, setSearchWord] = useState('');

  // --- 🌟 プレビュー（コーディネート選択）用の状態 ---
  const [selectedTop, setSelectedTop] = useState(null);
  const [selectedBottom, setSelectedBottom] = useState(null);

  // --- クローゼットデータ ---
  const [clothesList, setClothesList] = useState([]);

  useEffect(() => {
    refreshClothes();
  }, []);

  const refreshClothes = async () => {
    const allClothes = await db.clothes.toArray();
    setClothesList(allClothes);
  };

  // 画像リサイズ関数
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setImageSrc(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // データを保存する
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!imageSrc) return alert('洋服の画像を選択してください');

    await db.clothes.add({
      category,
      memo: memo || 'メモなし',
      image: imageSrc,
      color
    });

    setMemo('');
    setImageSrc(null);
    document.getElementById('fileInput').value = '';
    refreshClothes();
  };

  const handleDelete = async (id) => {
    // 選択中のプレビューが削除されたらクリアする
    if (selectedTop?.id === id) setSelectedTop(null);
    if (selectedBottom?.id === id) setSelectedBottom(null);
    
    await db.clothes.delete(id);
    refreshClothes();
  };

  // フィルタリング処理
  const filteredClothes = clothesList.filter((item) => {
    const matchCategory = searchCategory === 'すべて' || item.category === searchCategory;
    const matchWord = item.memo.toLowerCase().includes(searchWord.toLowerCase());
    return matchCategory && matchWord;
  });

  return (
    // translate="no" を入れることで、ブラウザの勝手な自動翻訳を強力にブロックします
    <div translate="no" style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>朝ラクローゼット - ステップ4</h1>

      {/* 🌟 【追加】上下コーディネートプレビューエリア */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '2px solid #28a745', borderRadius: '8px', backgroundColor: '#f4fbf7', textAlign: 'center' }}>
        <h3>【コーディネートプレビュー】</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '10px' }}>
          {/* トップス選択枠 */}
          <div style={{ width: '120px', minHeight: '140px', border: '1px dashed #ccc', padding: '5px', backgroundColor: '#fff' }}>
            <span style={{ fontSize: '11px', color: '#666' }}>トップス</span>
            {selectedTop ? (
              <img src={selectedTop.image} alt="Top" style={{ width: '100%', height: '110px', objectFit: 'cover', marginTop: '5px' }} />
            ) : (
              <p style={{ fontSize: '11px', color: '#999', marginTop: '30px' }}>未選択</p>
            )}
          </div>
          {/* ボトムス選択枠 */}
          <div style={{ width: '120px', minHeight: '140px', border: '1px dashed #ccc', padding: '5px', backgroundColor: '#fff' }}>
            <span style={{ fontSize: '11px', color: '#666' }}>ボトムス</span>
            {selectedBottom ? (
              <img src={selectedBottom.image} alt="Bottom" style={{ width: '100%', height: '110px', objectFit: 'cover', marginTop: '5px' }} />
            ) : (
              <p style={{ fontSize: '11px', color: '#999', marginTop: '30px' }}>未選択</p>
            )}
          </div>
        </div>
        {(selectedTop || selectedBottom) && (
          <button 
            onClick={() => { setSelectedTop(null); setSelectedBottom(null); }}
            style={{ fontSize: '11px', padding: '3px 10px' }}
          >
            プレビューをリセット
          </button>
        )}
      </div>

      {/* 登録フォーム */}
      <form onSubmit={handleAdd} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
        <h3>【洋服登録】</h3>
        <input id="fileInput" type="file" accept="image/*" onChange={handleImageChange} style={{ marginBottom: '10px' }} />
        
        {imageSrc && (
          <div style={{ margin: '10px 0' }}>
            <img src={imageSrc} alt="Preview" style={{ width: '100px', borderRadius: '4px' }} />
          </div>
        )}

        <div style={{ marginBottom: '10px' }}>
          <label>カテゴリ: </label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="トップス">トップス</option>
            <option value="ボトムス">ボトムス</option>
            <option value="ワンピース">ワンピース</option>
          </select>

          <label style={{ marginLeft: '15px' }}>色: </label>
          <select value={color} onChange={(e) => setColor(e.target.value)}>
            <option value="白">白</option>
            <option value="黒">黒</option>
            <option value="青">青</option>
            <option value="赤">赤</option>
            <option value="ベージュ">ベージュ</option>
          </select>
        </div>

        <input 
          type="text" 
          placeholder="服被り防止メモ（例: 山田さんランチ）" 
          value={memo} 
          onChange={(e) => setMemo(e.target.value)}
          style={{ width: '80%', padding: '5px', marginBottom: '10px' }}
        />
        <br />
        <button type="submit" style={{ padding: '5px 15px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}>登録</button>
      </form>

      {/* 検索・絞り込みエリア */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h3>【検索・条件絞り込み】</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <label>カテゴリ指定: </label>
          <select value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)} style={{ padding: '5px' }}>
            <option value="すべて">すべてのカテゴリ</option>
            <option value="トップス">トップス</option>
            <option value="ボトムス">ボトムス</option>
            <option value="ワンピース">ワンピース</option>
          </select>
        </div>

        <div>
          <label>キーワード検索（メモ）: </label>
          <input 
            type="text" 
            placeholder="人名やメモのキーワードを入力" 
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)} 
            style={{ padding: '5px', width: '60%' }}
          />
        </div>
      </div>

      {/* クローゼットの中身一覧 */}
      <h3>【該当データ一覧 （{filteredClothes.length}件）】</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
        {filteredClothes.map((item) => (
          <div key={item.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '6px', textAlign: 'center', backgroundColor: '#fff' }}>
            <img src={item.image} alt="服" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }} />
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '5px' }}>
              {item.category} <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>({item.color})</span>
            </div>
            <div style={{ fontSize: '11px', color: '#666', minHeight: '32px', margin: '4px 0' }}>{item.memo}</div>
            
            {/* 🌟 【追加】プレビューへ送るボタン */}
            <div style={{ marginBottom: '8px' }}>
              {item.category === 'トップス' && (
                <button onClick={() => setSelectedTop(item)} style={{ fontSize: '11px', padding: '2px 5px', width: '100%' }}>トップスに選択</button>
              )}
              {item.category === 'ボトムス' && (
                <button onClick={() => setSelectedBottom(item)} style={{ fontSize: '11px', padding: '2px 5px', width: '100%' }}>ボトムスに選択</button>
              )}
            </div>

            <button onClick={() => handleDelete(item.id)} style={{ padding: '2px 8px', fontSize: '11px', color: 'red', border: '1px solid red', borderRadius: '3px', backgroundColor: 'transparent' }}>
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;