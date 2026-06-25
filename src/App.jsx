import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';

// データベースの定義（season, sleeve を追加）
const db = new Dexie('asaRakuDatabase_v8');
db.version(1).stores({
  clothes: '++id, category, memo, image, color, season, sleeve' 
});

function App() {
  // --- タブ管理用の状態 ---
  const [activeTab, setActiveTab] = useState('register');

  // --- 登録用の状態 ---
  const [category, setCategory] = useState('トップス');
  const [memo, setMemo] = useState('');
  const [color, setColor] = useState('白');
  const [season, setSeason] = useState('通年'); // 🌟 季節の初期値
  const [sleeve, setSleeve] = useState('長袖'); // 🌟 袖・丈の初期値
  const [imageSrc, setImageSrc] = useState(null);
  
  // --- 検索用の状態 ---
  const [searchCategory, setSearchCategory] = useState('すべて');
  const [searchSeason, setSearchSeason] = useState('すべて'); // 🌟 検索用（季節）
  const [searchSleeve, setSearchSleeve] = useState('すべて'); // 🌟 検索用（袖・丈）
  const [searchWord, setSearchWord] = useState('');

  // --- プレビュー用の状態 ---
  const [selectedOuter, setSelectedOuter] = useState(null);
  const [selectedTop, setSelectedTop] = useState(null);
  const [selectedBottom, setSelectedBottom] = useState(null);
  const [selectedShoes, setSelectedShoes] = useState(null);

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
      color,
      season, // 🌟 季節を保存
      sleeve  // 🌟 袖・丈を保存
    });

    setMemo('');
    setImageSrc(null);
    document.getElementById('fileInput').value = '';
    alert('クローゼットに登録しました！');
    refreshClothes();
  };

  const handleDelete = async (id) => {
    if (selectedOuter?.id === id) setSelectedOuter(null);
    if (selectedTop?.id === id) setSelectedTop(null);
    if (selectedBottom?.id === id) setSelectedBottom(null);
    if (selectedShoes?.id === id) setSelectedShoes(null);
    await db.clothes.delete(id);
    refreshClothes();
  };

  // 🌟 フィルタリング処理（季節・袖丈の条件を追加）
  const filteredClothes = clothesList.filter((item) => {
    const matchCategory = searchCategory === 'すべて' || item.category === searchCategory;
    const matchSeason = searchSeason === 'すべて' || item.season === searchSeason;
    const matchSleeve = searchSleeve === 'すべて' || item.sleeve === searchSleeve;
    const matchWord = item.memo.toLowerCase().includes(searchWord.toLowerCase());
    
    return matchCategory && matchSeason && matchSleeve && matchWord;
  });

  // タブ用スタイル
  const tabStyle = (tabName) => ({
    flex: 1,
    padding: '12px 5px',
    cursor: 'pointer',
    backgroundColor: activeTab === tabName ? '#333' : '#eee',
    color: activeTab === tabName ? '#fff' : '#333',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '14px',
    textAlign: 'center',
    transition: '0.2s'
  });

  const previewBoxStyle = {
    width: '110px',
    minHeight: '140px',
    border: '1px dashed #ccc',
    padding: '5px',
    backgroundColor: '#fff',
    fontSize: '11px'
  };

  return (
    <div translate="no" style={{ padding: '15px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>朝ラクローゼット</h2>

      {/* 上部の2面切り替えタブ */}
      <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px', border: '1px solid #ccc' }}>
        <button onClick={() => setActiveTab('register')} style={tabStyle('register')}>服を登録</button>
        <button onClick={() => setActiveTab('preview')} style={tabStyle('preview')}>組み合わせチェック</button>
      </div>

      {/* ------------------ 上半分のエリア切り替え ------------------ */}
      {activeTab === 'register' ? (
        // ① 服を登録画面
        <form onSubmit={handleAdd} style={{ marginBottom: '25px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
          <h3 style={{ marginTop: 0 }}>【洋服登録】</h3>
          <input id="fileInput" type="file" accept="image/*" onChange={handleImageChange} style={{ marginBottom: '15px' }} />
          
          {imageSrc && (
            <div style={{ margin: '10px 0' }}>
              <img src={imageSrc} alt="Preview" style={{ width: '120px', borderRadius: '4px' }} />
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label>カテゴリ: </label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '5px' }}>
              <option value="トップス">トップス</option>
              <option value="ボトムス">ボトムス</option>
              <option value="ワンピース">ワンピース</option>
              <option value="アウター">アウター</option>
              <option value="シューズ">シューズ</option>
              <option value="小物・バッグ">小物・バッグ</option>
            </select>

            <label style={{ marginLeft: '15px' }}>色: </label>
            <select value={color} onChange={(e) => setColor(e.target.value)} style={{ padding: '5px' }}>
              <option value="白">白</option>
              <option value="黒">黒</option>
              <option value="青">青</option>
              <option value="赤">赤</option>
              <option value="ベージュ">ベージュ</option>
              <option value="グレー">グレー</option>
              <option value="その他">その他</option>
            </select>
          </div>

          {/* 🌟 【追加】季節と袖・丈の選択欄 */}
          <div style={{ marginBottom: '15px' }}>
            <label>季節: </label>
            <select value={season} onChange={(e) => setSeason(e.target.value)} style={{ padding: '5px' }}>
              <option value="通年">通年</option>
              <option value="春夏">春夏（夏物）</option>
              <option value="秋冬">秋冬（冬物）</option>
            </select>

            <label style={{ marginLeft: '15px' }}>袖・丈: </label>
            <select value={sleeve} onChange={(e) => setSleeve(e.target.value)} style={{ padding: '5px' }}>
              <option value="長袖">長袖 / 長ズボン</option>
              <option value="半袖">半袖 / 半ズボン</option>
              <option value="七分袖">七分袖 / クロップド</option>
              <option value="ノースリーブ">ノースリーブ / スカート</option>
              <option value="その他">その他</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <input 
              type="text" 
              placeholder="服被り防止メモ（例: 山田さんランチ）" 
              value={memo} 
              onChange={(e) => setMemo(e.target.value)}
              style={{ width: '95%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          
          <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
            クローゼットに登録する
          </button>
        </form>
      ) : (
        // ② 組み合わせチェック画面
        <div style={{ marginBottom: '25px', padding: '15px', border: '2px solid #28a745', borderRadius: '8px', backgroundColor: '#f4fbf7', textAlign: 'center' }}>
          <h3 style={{ marginTop: 0 }}>【コーディネートプレビュー】</h3>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
            {/* アウター */}
            <div style={previewBoxStyle}>
              <div style={{ fontWeight: 'bold', color: '#666' }}>アウター</div>
              {selectedOuter ? (
                <img src={selectedOuter.image} alt="Outer" style={{ width: '100%', height: '110px', objectFit: 'cover', marginTop: '5px' }} />
              ) : (
                <p style={{ color: '#999', marginTop: '35px' }}>未選択</p>
              )}
            </div>

            {/* トップス */}
            <div style={previewBoxStyle}>
              <div style={{ fontWeight: 'bold', color: '#666' }}>トップス</div>
              {selectedTop ? (
                <img src={selectedTop.image} alt="Top" style={{ width: '100%', height: '110px', objectFit: 'cover', marginTop: '5px' }} />
              ) : (
                <p style={{ color: '#999', marginTop: '35px' }}>未選択</p>
              )}
            </div>
            
            {/* ボトムス */}
            <div style={previewBoxStyle}>
              <div style={{ fontWeight: 'bold', color: '#666' }}>ボトムス</div>
              {selectedBottom ? (
                <img src={selectedBottom.image} alt="Bottom" style={{ width: '100%', height: '110px', objectFit: 'cover', marginTop: '5px' }} />
              ) : (
                <p style={{ color: '#999', marginTop: '35px' }}>未選択</p>
              )}
            </div>

            {/* シューズ */}
            <div style={previewBoxStyle}>
              <div style={{ fontWeight: 'bold', color: '#666' }}>シューズ</div>
              {selectedShoes ? (
                <img src={selectedShoes.image} alt="Shoes" style={{ width: '100%', height: '110px', objectFit: 'cover', marginTop: '5px' }} />
              ) : (
                <p style={{ color: '#999', marginTop: '35px' }}>未選択</p>
              )}
            </div>
          </div>

          {(selectedOuter || selectedTop || selectedBottom || selectedShoes) && (
            <button onClick={() => { setSelectedOuter(null); setSelectedTop(null); setSelectedBottom(null); setSelectedShoes(null); }} style={{ padding: '6px 15px', fontSize: '12px' }}>
              プレビューをリセット
            </button>
          )}
        </div>
      )}

      <hr style={{ margin: '25px 0', border: '0', borderTop: '2px solid #ddd' }} />

      {/* ------------------ 下半分のエリア（常に表示される服一覧＆検索） ------------------ */}
      <div>
        {/* 検索・絞り込み条件エリア */}
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <h3 style={{ marginTop: 0 }}>【検索・条件絞り込み】</h3>
          
          <div style={{ marginBottom: '10px' }}>
            <label>カテゴリ: </label>
            <select value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)} style={{ padding: '3px' }}>
              <option value="すべて">すべてのカテゴリ</option>
              <option value="トップス">トップス</option>
              <option value="ボトムス">ボトムス</option>
              <option value="ワンピース">ワンピース</option>
              <option value="アウター">アウター</option>
              <option value="シューズ">シューズ</option>
              <option value="小物・バッグ">小物・バッグ</option>
            </select>

            {/* 🌟 【追加】検索用の季節絞り込み */}
            <label style={{ marginLeft: '10px' }}>季節: </label>
            <select value={searchSeason} onChange={(e) => setSearchSeason(e.target.value)} style={{ padding: '3px' }}>
              <option value="すべて">すべての季節</option>
              <option value="通年">通年</option>
              <option value="春夏">春夏（夏物）</option>
              <option value="秋冬">秋冬（冬物）</option>
            </select>
          </div>

          {/* 🌟 【追加】検索用の袖・丈絞り込み */}
          <div style={{ marginBottom: '10px' }}>
            <label>袖・丈指定: </label>
            <select value={searchSleeve} onChange={(e) => setSearchSleeve(e.target.value)} style={{ padding: '3px' }}>
              <option value="すべて">すべての袖・丈</option>
              <option value="長袖">長袖 / 長ズボン</option>
              <option value="半袖">半袖 / 半ズボン</option>
              <option value="七分袖">七分袖 / クロップド</option>
              <option value="ノースリーブ">ノースリーブ / スカート</option>
              <option value="その他">その他</option>
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
              
              {/* 🌟 登録した季節や袖丈がカード上にバッジのように表示されます */}
              <div style={{ fontSize: '10px', color: '#e67e22', margin: '2px 0' }}>
                {item.season} / {item.sleeve}
              </div>

              <div style={{ fontSize: '11px', color: '#666', minHeight: '32px', margin: '4px 0' }}>{item.memo}</div>
              
              {/* 選択ボタン */}
              <div style={{ marginBottom: '8px' }}>
                {item.category === 'アウター' && (
                  <button onClick={() => setSelectedOuter(item)} style={{ fontSize: '11px', padding: '4px 5px', width: '100%' }}>アウターに選択</button>
                )}
                {item.category === 'トップス' && (
                  <button onClick={() => setSelectedTop(item)} style={{ fontSize: '11px', padding: '4px 5px', width: '100%' }}>トップスに選択</button>
                )}
                {item.category === 'ボトムス' && (
                  <button onClick={() => setSelectedBottom(item)} style={{ fontSize: '11px', padding: '4px 5px', width: '100%' }}>ボトムスに選択</button>
                )}
                {item.category === 'シューズ' && (
                  <button onClick={() => setSelectedShoes(item)} style={{ fontSize: '11px', padding: '4px 5px', width: '100%' }}>シューズに選択</button>
                )}
              </div>

              <button onClick={() => handleDelete(item.id)} style={{ padding: '2px 8px', fontSize: '11px', color: 'red', border: '1px solid red', borderRadius: '3px', backgroundColor: 'transparent', cursor: 'pointer' }}>
                削除
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;