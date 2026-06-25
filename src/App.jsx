import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';

// 1. データベースの定義（image を追加）
const db = new Dexie('asaRakuDatabase_v2');
db.version(1).stores({
  clothes: '++id, category, memo, image' 
});

function App() {
  const [category, setCategory] = useState('トップス');
  const [memo, setMemo] = useState('');
  const [imageSrc, setImageSrc] = useState(null); // リサイズ後の画像（画面表示用）
  const [clothesList, setClothesList] = useState([]);

  useEffect(() => {
    refreshClothes();
  }, []);

  const refreshClothes = async () => {
    const allClothes = await db.clothes.toArray();
    setClothesList(allClothes);
  };

  // 🔥 2. 画像を自動でリサイズ（軽量化）する関数
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500; // 横幅を最大500pxに制限（スマホ表示ならこれで十分！）
        let width = img.width;
        let height = img.height;

        // 比率を保ったまま縮小
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 画質を0.7（70%）に落として、軽量なJPEGデータ（DataURL）に変換
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setImageSrc(compressedDataUrl); // 画面にプレビュー表示
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // 3. データを保存する（画像も一緒に保存）
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!imageSrc) return alert('洋服の画像を選択（または撮影）してください');

    await db.clothes.add({
      category: category,
      memo: memo || 'メモなし',
      image: imageSrc // 軽量化した画像データをそのまま保存
    });

    setMemo('');
    setImageSrc(null);
    // フォームのファイル選択をリセット
    document.getElementById('fileInput').value = '';
    refreshClothes();
  };

  const handleDelete = async (id) => {
    await db.clothes.delete(id);
    refreshClothes();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>朝ラクローゼット - ステップ2（画像リサイズ保存）</h1>

      {/* 登録フォーム */}
      <form onSubmit={handleAdd} style={{ marginBottom: '30px', padding: '15px', border: '2px solid #333', borderRadius: '8px' }}>
        <h3>【洋服の登録（カメラ/ファイル）】</h3>
        
        <label style={{ display: 'block', marginBottom: '10px' }}>
          ① 画像を選んでください:<br />
          <input 
            id="fileInput"
            type="file" 
            accept="image/*" 
            capture="environment" // スマホの場合、直接カメラが起動しやすくなります
            onChange={handleImageChange} 
          />
        </label>

        {/* リサイズ後のプレビュー表示 */}
        {imageSrc && (
          <div style={{ margin: '10px 0' }}>
            <p style={{ color: 'green', fontSize: '12px' }}>✓ 画像を軽量化しました（プレビュー）:</p>
            <img src={imageSrc} alt="Preview" style={{ width: '150px', borderRadius: '4px' }} />
          </div>
        )}

        <label style={{ display: 'block', marginBottom: '10px' }}>
          ② カテゴリ:<br />
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '5px', width: '100px' }}>
            <option value="トップス">トップス</option>
            <option value="ボトムス">ボトムス</option>
            <option value="ワンピース">ワンピース</option>
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: '15px' }}>
          ③ メモ（服被り防止用）:<br />
          <input 
            type="text" 
            placeholder="例: 山田さんと会った服" 
            value={memo} 
            onChange={(e) => setMemo(e.target.value)}
            style={{ padding: '5px', width: '80%' }}
          />
        </label>

        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          クローゼットに保存
        </button>
      </form>

      {/* クローゼットの中身一覧 */}
      <h3>【現在のクローゼットの中身】</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
        {clothesList.map((item) => (
          <div key={item.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '6px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
            <img src={item.image} alt="服" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }} />
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '5px' }}>{item.category}</div>
            <div style={{ fontSize: '11px', color: '#666', minHeight: '32px', margin: '4px 0' }}>{item.memo}</div>
            <button onClick={() => handleDelete(item.id)} style={{ padding: '2px 8px', fontSize: '11px', color: 'red', border: '1px solid red', borderRadius: '3px', backgroundColor: 'transparent', cursor: 'pointer' }}>
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;