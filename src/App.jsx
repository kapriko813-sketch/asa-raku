import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';

// データベースの定義
const db = new Dexie('asaRakuDatabase_v5');
db.version(1).stores({
  clothes: '++id, category, memo, image, color' 
});

function App() {
  // --- 🌟 タブ管理用の状態（'register', 'list', 'preview'） ---
  const [activeTab, setActiveTab] = useState('register');

  // --- 登録用の状態 ---
  const [category, setCategory] = useState('トップス');
  const [memo, setMemo] = useState('');
  const [color, setColor] = useState('白');
  const [imageSrc, setImageSrc] = useState(null);
  
  // --- 検索用の状態 ---
  const [searchCategory, setSearchCategory] = useState('すべて');
  const [searchWord, setSearchWord] = useState('');

  // --- プレビュー（コーディネート選択）用の状態 ---
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
    alert('クローゼットに登録しました！');
    refreshClothes();
    // 登録完了後、自動的に一覧タブに移動するとスムーズです
    setActiveTab('list');
  };

  const handleDelete = async (id) => {
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

  // スタイル用：タブの共通デザイン
  const tabStyle = (tabName) => ({
    flex: 1,
    padding: '12px 5px',
    cursor: 'pointer',
    backgroundColor: activeTab === tabName ? '#333' : '#eee',
    color: activeTab === tabName ? '#fff' : '#333',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '13px',
    textAlign: 'center',
    transition: '0.2s'
  });

  return (
    <div translate="no" style={{ padding: '15px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>朝ラクローゼット</h2>

      {/* 🌟 画面最上部のタブメニュー */}
      <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px', border: '1px solid #ccc' }}>
        <button onClick={() => setActiveTab('register')} style={tabStyle('register')}>服を登録</button>
        <button onClick={() => setActiveTab('list')} style={tabStyle('list')}>服一覧・検索</button>
        <button onClick={() => setActiveTab('preview')} style={tabStyle('preview')}>組み合わせチェック</button>
      </div>

      {/* ------------------ ① 服を登録タブ ------------------ */}
      {activeTab === 'register' && (
        <form onSubmit={handleAdd} style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
          <h3 style={{ marginTop: 0 }}>【洋服登録】</h3>
          <input id="fileInput" type="file" accept="image/*" onChange={handleImageChange} style={{ marginBottom: '15px' }} />
          
          {imageSrc && (
            <div style={{ margin: '10px 0' }}>
              <img src={imageSrc} alt="Preview" style={{ width: '120px', borderRadius: '4px' }} />
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label>カテゴリ: </label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '5px' }}>
              <option value="トップス">トップス</option>
              <option value="ボトムス">ボトムス</option>
              <option value="ワンピース">ワンピース</option>
            </select>

            <label style={{ marginLeft: '15px' }}>色: </label>
            <select value={color} onChange={(e) => setColor(e.target.value)} style={{ padding: '5px' }}>
              <option value="白">白</option>
              <option value="黒">黒</option>
              <option value="青">青</option>
              <option value="赤">赤</option>
              <option value="ベージュ">ベージュ</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="服被り防止メモ（例: 山田さんランチ）" 
              value={memo} 
              onChange={(e) => setMemo(e.target.value)}
              style={{ width: '95%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          
          <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
            クローゼットに登録する
          </button>
        </form>
      )}

      {/* ------------------ ② 服一覧・検索タブ ------------------ */}
      {activeTab === 'list' && (
        <div>
          {/* 検索・絞り込み条件エリア */}
          <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
            <h3 style={{ marginTop: 0 }}>【検索・条件絞り込み】</h3>
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
              <label style={{ display: 'block', marginBottom: '5px' }}>キーワード検索（メモ）: </label>
              <input 
                type="text" 
                placeholder="人名やメモのキーワードを入力" 
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)} 
                style={{ padding: '8px', width: '95%', boxSizing: 'border-box' }}
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
                
                {/* プレビュー選択ショートカット */}
                <div style={{ marginBottom: '8px' }}>
                  {item.category === 'トップス' && (
                    <button onClick={() => { setSelectedTop(item); alert('トップスに選択しました。組み合わせタブで確認できます！'); }} style={{ fontSize: '11px', padding: '4px 5px', width: '100%' }}>プレビュー用に選択</button>
                  )}
                  {item.category === 'ボトムス' && (
                    <button onClick={() => { setSelectedBottom(item); alert('ボトムスに選択しました。組み合わせタブで確認できます！'); }} style={{ fontSize: '11px', padding: '4px 5px', width: '100%' }}>プレビュー用に選択</button>
                  )}
                </div>

                <button onClick={() => handleDelete(item.id)} style={{ padding: '2px 8px', fontSize: '11px', color: 'red', border: '1px solid red', borderRadius: '3px', backgroundColor: 'transparent' }}>
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------ ③ 組み合わせチェックタブ ------------------ */}
      {activeTab === 'preview' && (
        <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f4fbf7', textAlign: 'center' }}>
          <h3 style={{ marginTop: 0 }}>【コーディネートプレビュー】</h3>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px' }}>
            {/* トップス選択枠 */}
            <div style={{ width: '140px', minHeight: '160px', border: '1px dashed #ccc', padding: '5px', backgroundColor: '#fff' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>トップス</div>
              {selectedTop ? (
                <img src={selectedTop.image} alt="Top" style={{ width: '100%', height: '130px', objectFit: 'cover', marginTop: '5px' }} />
              ) : (
                <p style={{ fontSize: '11px', color: '#999', marginTop: '45px' }}>一覧タブから<br />選択してください</p>
              )}
            </div>
            
            {/* ボトムス選択枠 */}
            <div style={{ width: '140px', minHeight: '160px', border: '1px dashed #ccc', padding: '5px', backgroundColor: '#fff' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>ボトムス</div>
              {selectedBottom ? (
                <img src={selectedBottom.image} alt="Bottom" style={{ width: '100%', height: '130px', objectFit: 'cover', marginTop: '5px' }} />
              ) : (
                <p style={{ fontSize: '11px', color: '#999', marginTop: '45px' }}>一覧タブから<br />選択してください</p>
              )}
            </div>
          </div>

          {(selectedTop || selectedBottom) && (
            <button 
              onClick={() => { setSelectedTop(null); setSelectedBottom(null); }}
              style={{ padding: '6px 15px', fontSize: '12px', borderRadius: '4px', cursor: 'pointer' }}
            >
              選択をリセット
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;