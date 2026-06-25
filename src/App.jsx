import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';

// 1. IndexedDBのデータベースを定義（名前: asaRakuDatabase）
const db = new Dexie('asaRakuDatabase');
db.version(1).stores({
  clothes: '++id, category, memo' // ++id は自動で増える識別番号
});

function App() {
  // 状態管理（フォームの入力値と、保存された服の一覧）
  const [category, setCategory] = useState('トップス');
  const [memo, setMemo] = useState('');
  const [clothesList, setClothesList] = useState([]);

  // 2. 画面が表示された時と、データが更新された時に一覧を読み込む
  useEffect(() => {
    refreshClothes();
  }, []);

  const refreshClothes = async () => {
    const allClothes = await db.clothes.toArray();
    setClothesList(allClothes);
  };

  // 3. データを保存する関数
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!memo.trim()) return alert('メモを入力してください');

    await db.clothes.add({
      category: category,
      memo: memo
    });

    setMemo(''); // 入力欄をクリア
    refreshClothes(); // 一覧を再更新
  };

  // 4. データを削除する関数
  const handleDelete = async (id) => {
    await db.clothes.delete(id);
    refreshClothes(); // 一覧を再更新
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>朝ラクローゼット - ステップ1 テスト画面</h1>
      <p>※見た目は気にせず、裏側のデータ保存の実験です。</p>

      {/* 入力フォーム */}
      <form onSubmit={handleAdd} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>【服の登録】</h3>
        <label>カテゴリ：</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="トップス">トップス</option>
          <option value="ボトムス">ボトムス</option>
          <option value="ワンピース">ワンピース</option>
        </select>
        <br /><br />
        <label>服被り防止メモ：</label>
        <input 
          type="text" 
          placeholder="例：山田さんと会う用" 
          value={memo} 
          onChange={(e) => setMemo(e.target.value)}
        />
        <br /><br />
        <button type="submit">ブラウザに保存する</button>
      </form>

      {/* 保存されたデータの一覧表示 */}
      <div style={{ padding: '10px', border: '1px solid #ccc' }}>
        <h3>【クローゼットの中身（IndexedDB）】</h3>
        {clothesList.length === 0 ? (
          <p>まだ登録されていません。</p>
        ) : (
          <ul>
            {clothesList.map((item) => (
              <li key={item.id} style={{ marginBottom: '10px' }}>
                <strong>[{item.category}]</strong> {item.memo} 
                <button onClick={() => handleDelete(item.id)} style={{ marginLeft: '10px', color: 'red' }}>
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;