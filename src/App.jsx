import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';

// データベースの定義
const db = new Dexie('asaRakuDatabase_v14');
db.version(1).stores({
  clothes: '++id, category, memo, image, color, season, sleeve',
  history: '++id, date, image, memo, outerId, topId, bottomId, shoesId, pieceId, accessoryId'
});
// バージョン2: コーディネートセット用のテーブルを追加（既存データは保持されます）
db.version(2).stores({
  sets: '++id, name, outerId, topId, bottomId, pieceId, shoesId, accessoryId'
});

// 基本の色リスト
const defaultColors = ['白', '黒', '青', '赤', 'ベージュ', 'グレー'];

function App() {
  // --- タブ管理用の状態 ---
  const [activeTab, setActiveTab] = useState('register');

  // --- 検索エリアの開閉状態 ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // --- ドラッグ状態を管理する状態 ---
  const [isDragOverRegister, setIsDragOverRegister] = useState(false);
  const [isDragOverHistory, setIsDragOverHistory] = useState(false);

  // --- 組み合わせ表示切り替え用のチェックボックス状態 ---
  const [visibleSlots, setVisibleSlots] = useState({
    outer: true,
    top: true,
    bottom: true,
    piece: false,
    shoes: true,
    accessory: true 
  });

  // --- 編集中の服のID（null の時は新規登録モード） ---
  const [editingId, setEditingId] = useState(null);

  // --- ユーザーが追加したカスタムカラーの読み込み ---
  const [savedCustomColors, setSavedCustomColors] = useState(() => {
    const saved = localStorage.getItem('customColors');
    return saved ? JSON.parse(saved) : [];
  });
  const [customColorInput, setCustomColorInput] = useState('');

  // --- ① 服の登録・編集用の状態 ---
  const [category, setCategory] = useState('トップス');
  const [memo, setMemo] = useState('');
  const [color, setColor] = useState('白');
  const [season, setSeason] = useState('通年'); 
  const [sleeve, setSleeve] = useState('長袖'); 
  const [imageSrc, setImageSrc] = useState(null);
  
  // --- ② 検索用の状態 ---
  const [searchCategory, setSearchCategory] = useState('すべて');
  const [searchColor, setSearchColor] = useState('すべて'); 
  const [searchSeason, setSearchSeason] = useState('すべて'); 
  const [searchSleeve, setSearchSleeve] = useState('すべて'); 
  const [searchWord, setSearchWord] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  // --- ③ コーディネートプレビューの状態 ---
  const [selectedOuter, setSelectedOuter] = useState(null);
  const [selectedTop, setSelectedTop] = useState(null);
  const [selectedBottom, setSelectedBottom] = useState(null);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [selectedShoes, setSelectedShoes] = useState(null);
  const [selectedAccessory, setSelectedAccessory] = useState(null);

  // --- ④ 「今日着た服」タブ用の状態 ---
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyImage, setHistoryImage] = useState(null);
  const [historyMemo, setHistoryMemo] = useState('');
  const [historyList, setHistoryList] = useState([]);

  // --- ⑤ コーディネートセット用の状態 ---
  const [savedSets, setSavedSets] = useState([]);
  const [setName, setSetName] = useState('');

  // --- クローゼットデータ ---
  const [clothesList, setClothesList] = useState([]);

  useEffect(() => {
    refreshClothes();
    refreshHistory();
    refreshSets();
  }, []);

  const refreshClothes = async () => {
    const allClothes = await db.clothes.toArray();
    setClothesList(allClothes);
  };

  const refreshHistory = async () => {
    const allHistory = await db.history.orderBy('date').reverse().toArray();
    setHistoryList(allHistory);
  };

  const refreshSets = async () => {
    const allSets = await db.sets.toArray();
    setSavedSets(allSets);
  };

  const handleCategoryChange = (e) => {
    const nextCategory = e.target.value;
    setCategory(nextCategory);
    
    if (nextCategory === 'ボトムス') {
      setSleeve('長ズボン');
    } else if (nextCategory === 'トップス' || nextCategory === 'ワンピース') {
      setSleeve('長袖');
    } else {
      setSleeve('なし'); 
    }
  };

  const resizeImage = (file, callback) => {
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
        callback(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) resizeImage(e.target.files[0], setImageSrc);
  };

  const handleHistoryImageChange = (e) => {
    if (e.target.files[0]) resizeImage(e.target.files[0], setHistoryImage);
  };

  const handleDropRegister = (e) => {
    e.preventDefault();
    setIsDragOverRegister(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) resizeImage(file, setImageSrc);
  };

  const handleDropHistory = (e) => {
    e.preventDefault();
    setIsDragOverHistory(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) resizeImage(file, setHistoryImage);
  };

  const handleSaveClothes = async (e) => {
    e.preventDefault();
    if (!imageSrc) return alert('洋服の画像を選択またはドラッグしてください');

    let finalColor = color;
    if (color === 'その他' && customColorInput.trim() !== '') {
      finalColor = customColorInput.trim();
      if (!savedCustomColors.includes(finalColor)) {
        const newColors = [...savedCustomColors, finalColor];
        setSavedCustomColors(newColors);
        localStorage.setItem('customColors', JSON.stringify(newColors));
      }
    }

    if (editingId) {
      await db.clothes.update(editingId, {
        category, memo: memo || 'メモなし', image: imageSrc, color: finalColor, season, sleeve  
      });
      alert('クローゼットの情報を更新しました！');
      setEditingId(null);
    } else {
      await db.clothes.add({
        category, memo: memo || 'メモなし', image: imageSrc, color: finalColor, season, sleeve  
      });
      alert('クローゼットに登録しました！');
    }

    setMemo('');
    setImageSrc(null);
    setColor('白');
    setCustomColorInput('');
    refreshClothes();
  };

  const handleEditStart = (item) => {
    setEditingId(item.id);
    setCategory(item.category);
    setMemo(item.memo === 'メモなし' ? '' : item.memo);
    setSeason(item.season);
    setSleeve(item.sleeve);
    setImageSrc(item.image);
    
    if (!defaultColors.includes(item.color) && !savedCustomColors.includes(item.color) && item.color !== 'その他') {
      setColor('その他');
      setCustomColorInput(item.color);
    } else {
      setColor(item.color);
      setCustomColorInput('');
    }
    
    setActiveTab('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCategory('トップス');
    setMemo('');
    setColor('白');
    setCustomColorInput('');
    setSeason('通年');
    setSleeve('長袖');
    setImageSrc(null);
  };

  const handleAddHistory = async (e) => {
    e.preventDefault();
    if (!historyImage) return alert('全身の写真を選択またはドラッグしてください');

    await db.history.add({
      date: historyDate,
      image: historyImage,
      memo: historyMemo || '着用メモなし',
      outerId: visibleSlots.outer ? (selectedOuter?.id || null) : null,
      topId: visibleSlots.top ? (selectedTop?.id || null) : null,
      bottomId: visibleSlots.bottom ? (selectedBottom?.id || null) : null,
      pieceId: visibleSlots.piece ? (selectedPiece?.id || null) : null,
      shoesId: visibleSlots.shoes ? (selectedShoes?.id || null) : null,
      accessoryId: visibleSlots.accessory ? (selectedAccessory?.id || null) : null
    });

    setHistoryMemo('');
    setHistoryImage(null);
    alert('着用履歴を記録しました！');
    refreshHistory();
  };

  // 履歴の削除処理を追加
  const handleDeleteHistory = async (id, date) => {
    const isConfirmed = window.confirm(`${date} の着用履歴を削除しますか？\n（一度削除すると元に戻せません）`);
    if (!isConfirmed) return;
    await db.history.delete(id);
    refreshHistory();
  };

  const handleDelete = async (id, categoryName) => {
    const isConfirmed = window.confirm(`本当にこの${categoryName}をクローゼットから削除しますか？\n（一度削除すると元に戻せません）`);
    if (!isConfirmed) return;

    if (selectedOuter?.id === id) setSelectedOuter(null);
    if (selectedTop?.id === id) setSelectedTop(null);
    if (selectedBottom?.id === id) setSelectedBottom(null);
    if (selectedPiece?.id === id) setSelectedPiece(null);
    if (selectedShoes?.id === id) setSelectedShoes(null);
    if (selectedAccessory?.id === id) setSelectedAccessory(null);
    
    if (editingId === id) handleCancelEdit();

    await db.clothes.delete(id);
    refreshClothes();
  };

  // --- セット関連のハンドラ ---
  const handleSaveSet = async () => {
    if (!setName.trim()) return alert('保存するセット名を入力してください（例: オフィス用、デート用）');
    
    await db.sets.add({
      name: setName,
      outerId: visibleSlots.outer ? (selectedOuter?.id || null) : null,
      topId: visibleSlots.top ? (selectedTop?.id || null) : null,
      bottomId: visibleSlots.bottom ? (selectedBottom?.id || null) : null,
      pieceId: visibleSlots.piece ? (selectedPiece?.id || null) : null,
      shoesId: visibleSlots.shoes ? (selectedShoes?.id || null) : null,
      accessoryId: visibleSlots.accessory ? (selectedAccessory?.id || null) : null
    });
    setSetName('');
    alert('コーディネートセットを保存しました！');
    refreshSets();
  };

  const handleLoadSet = (set) => {
    setSelectedOuter(clothesList.find(c => c.id === set.outerId) || null);
    setSelectedTop(clothesList.find(c => c.id === set.topId) || null);
    setSelectedBottom(clothesList.find(c => c.id === set.bottomId) || null);
    setSelectedPiece(clothesList.find(c => c.id === set.pieceId) || null);
    setSelectedShoes(clothesList.find(c => c.id === set.shoesId) || null);
    setSelectedAccessory(clothesList.find(c => c.id === set.accessoryId) || null);
    
    // セットに含まれるアイテムに合わせてチェックボックスを自動切り替え
    setVisibleSlots({
      outer: !!set.outerId,
      top: !!set.topId,
      bottom: !!set.bottomId,
      piece: !!set.pieceId,
      shoes: !!set.shoesId,
      accessory: !!set.accessoryId
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSet = async (id) => {
    if(!window.confirm('このコーディネートセットを削除しますか？')) return;
    await db.sets.delete(id);
    refreshSets();
  };
  // -------------------------

  const filteredClothes = clothesList.filter((item) => {
    const matchCategory = searchCategory === 'すべて' || item.category === searchCategory;
    const matchColor = searchColor === 'すべて' || item.color === searchColor; 
    const matchSeason = searchSeason === 'すべて' || item.season === searchSeason;
    const matchSleeve = searchSleeve === 'すべて' || item.sleeve === searchSleeve;
    const matchWord = item.memo.toLowerCase().includes(searchWord.toLowerCase());
    return matchCategory && matchColor && matchSeason && matchSleeve && matchWord;
  }).sort((a, b) => {
    if (sortOrder === 'color') {
      return a.color.localeCompare(b.color, 'ja');
    }
    return b.id - a.id; 
  });

  const tabStyle = (tabName) => ({
    flex: 1,
    padding: '12px 2px',
    cursor: 'pointer',
    backgroundColor: activeTab === tabName ? '#333' : '#eee',
    color: activeTab === tabName ? '#fff' : '#333',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '13px',
    textAlign: 'center',
    transition: '0.2s'
  });

  const dropZoneStyle = (isDragOver) => ({
    border: isDragOver ? '2px dashed #007bff' : '2px dashed #ccc',
    backgroundColor: isDragOver ? '#e6f2ff' : '#fafafa',
    padding: '20px 10px',
    borderRadius: '8px',
    textAlign: 'center',
    cursor: 'pointer',
    marginBottom: '15px',
    transition: 'all 0.2s ease'
  });

  const previewBoxStyle = {
    width: '100px',
    minHeight: '130px',
    border: '1px dashed #ccc',
    padding: '5px',
    backgroundColor: '#fff',
    fontSize: '11px',
    textAlign: 'center'
  };

  const handleCheckboxChange = (slot) => {
    setVisibleSlots(prev => ({ ...prev, [slot]: !prev[slot] }));
  };

  const getSelectButtonStyle = (isSelected, defaultColor = '#fff', activeColor = '#28a745') => ({
    fontSize: '11px', 
    padding: '6px 5px', 
    width: '100%', 
    fontWeight: isSelected ? 'bold' : 'normal',
    color: isSelected ? '#fff' : '#333', 
    backgroundColor: isSelected ? activeColor : defaultColor,
    border: `1px solid ${isSelected ? activeColor : '#ccc'}`,
    borderRadius: '4px',
    cursor: 'pointer',
    transition: '0.2s'
  });

  const hasSelectedHistoryItem = 
    (visibleSlots.outer && selectedOuter) ||
    (visibleSlots.top && selectedTop) ||
    (visibleSlots.bottom && selectedBottom) ||
    (visibleSlots.piece && selectedPiece) ||
    (visibleSlots.shoes && selectedShoes) ||
    (visibleSlots.accessory && selectedAccessory);

  return (
    <div translate="no" style={{ padding: '15px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>朝ラクローゼット</h2>

      <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px', border: '1px solid #ccc' }}>
        <button onClick={() => setActiveTab('register')} style={tabStyle('register')}>
          {editingId ? '服を編集' : '服を登録'}
        </button>
        <button onClick={() => setActiveTab('preview')} style={tabStyle('preview')}>組み合わせ</button>
        <button onClick={() => setActiveTab('history')} style={tabStyle('history')}>今日着た服</button>
      </div>

      {activeTab === 'register' && (
        <form onSubmit={handleSaveClothes} style={{ marginBottom: '25px', padding: '15px', border: editingId ? '2px solid #007bff' : '1px solid #ccc', borderRadius: '8px', backgroundColor: editingId ? '#f0f7ff' : '#fdfdfd' }}>
          <h3 style={{ marginTop: 0, color: editingId ? '#007bff' : '#333' }}>
            {editingId ? '【洋服の編集】' : '【洋服登録】'}
          </h3>
          
          <div style={dropZoneStyle(isDragOverRegister)} onDragOver={(e) => { e.preventDefault(); setIsDragOverRegister(true); }} onDragLeave={() => setIsDragOverRegister(false)} onDrop={handleDropRegister} onClick={() => document.getElementById('fileInput').click()}>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>画像を<b>ドラッグ＆ドロップ</b>または<b>クリック選択</b></p>
            <input id="fileInput" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          </div>

          {imageSrc && <div style={{ margin: '10px 0', textAlign: 'center' }}><img src={imageSrc} alt="Preview" style={{ width: '120px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>}
          
          <div style={{ marginBottom: '12px' }}>
            <label>カテゴリ: </label>
            <select value={category} onChange={handleCategoryChange} style={{ padding: '5px' }}>
              <option value="トップス">トップス</option><option value="ボトムス">ボトムス</option><option value="ワンピース">ワンピース</option><option value="アウター">アウター</option><option value="シューズ">シューズ</option><option value="小物・バッグ">小物・バッグ</option>
            </select>
            
            <label style={{ marginLeft: '15px' }}>色: </label>
            <select value={color} onChange={(e) => setColor(e.target.value)} style={{ padding: '5px' }}>
              {defaultColors.map(c => <option key={c} value={c}>{c}</option>)}
              {savedCustomColors.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="その他">その他（自由入力）</option>
            </select>
            
            {color === 'その他' && (
              <input 
                type="text" 
                placeholder="新しい色を入力" 
                value={customColorInput} 
                onChange={(e) => setCustomColorInput(e.target.value)} 
                style={{ marginLeft: '10px', padding: '5px', width: '100px', border: '1px solid #007bff', borderRadius: '3px' }} 
              />
            )}
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>季節: </label>
            <select value={season} onChange={(e) => setSeason(e.target.value)} style={{ padding: '5px' }}>
              <option value="通年">通年</option><option value="春夏">春夏（夏物）</option><option value="秋冬">秋冬（冬物）</option>
              {category === '小物・バッグ' && <option value="指定なし">指定なし</option>}
            </select>
            {(category === 'トップス' || category === 'ワンピース') && (
              <span style={{ marginLeft: '15px' }}><label>袖: </label>
                <select value={sleeve} onChange={(e) => setSleeve(e.target.value)} style={{ padding: '5px' }}>
                  <option value="長袖">長袖</option><option value="半袖">半袖</option><option value="七分袖">七分袖</option><option value="ノースリーブ">ノースリーブ</option>
                </select>
              </span>
            )}
            {category === 'ボトムス' && (
              <span style={{ marginLeft: '15px' }}><label>丈: </label>
                <select value={sleeve} onChange={(e) => setSleeve(e.target.value)} style={{ padding: '5px' }}>
                  <option value="長ズボン">長ズボン</option><option value="半ズボン">半ズボン</option><option value="七分丈">七分丈</option><option value="スカート">スカート</option>
                </select>
              </span>
            )}
          </div>
          <div style={{ marginBottom: '15px' }}><input type="text" placeholder="服被り防止メモ（例: 山田さんランチ）" value={memo} onChange={(e) => setMemo(e.target.value)} style={{ width: '95%', padding: '8px', boxSizing: 'border-box' }} /></div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ flex: 2, padding: '10px', backgroundColor: editingId ? '#007bff' : '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              {editingId ? '変更を保存する' : 'クローゼットに登録する'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} style={{ flex: 1, padding: '10px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                キャンセル
              </button>
            )}
          </div>
        </form>
      )}

      {activeTab === 'preview' && (
        <div style={{ marginBottom: '25px', padding: '15px', border: '2px solid #28a745', borderRadius: '8px', backgroundColor: '#f4fbf7' }}>
          <h3 style={{ marginTop: 0, textAlign: 'center' }}>【コーディネートプレビュー】</h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', padding: '8px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '15px', fontSize: '12px' }}>
            <span style={{ fontWeight: 'bold', color: '#28a745' }}>合わせる項目：</span>
            <label><input type="checkbox" checked={visibleSlots.outer} onChange={() => handleCheckboxChange('outer')} /> アウター</label>
            <label><input type="checkbox" checked={visibleSlots.top} onChange={() => handleCheckboxChange('top')} /> トップス</label>
            <label><input type="checkbox" checked={visibleSlots.bottom} onChange={() => handleCheckboxChange('bottom')} /> ボトムス</label>
            <label><input type="checkbox" checked={visibleSlots.piece} onChange={() => handleCheckboxChange('piece')} /> ワンピース</label>
            <label><input type="checkbox" checked={visibleSlots.shoes} onChange={() => handleCheckboxChange('shoes')} /> シューズ</label>
            <label><input type="checkbox" checked={visibleSlots.accessory} onChange={() => handleCheckboxChange('accessory')} /> 小物・バッグ</label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
            {visibleSlots.outer && (
              <div style={previewBoxStyle}>
                <div style={{ fontWeight: 'bold', color: '#666' }}>アウター</div>
                {selectedOuter ? <img src={selectedOuter.image} alt="Outer" style={{ width: '100%', height: '100px', objectFit: 'cover', marginTop: '5px' }} /> : <p style={{ color: '#999', marginTop: '30px' }}>未選択</p>}
              </div>
            )}
            {visibleSlots.top && (
              <div style={previewBoxStyle}>
                <div style={{ fontWeight: 'bold', color: '#666' }}>トップス</div>
                {selectedTop ? <img src={selectedTop.image} alt="Top" style={{ width: '100%', height: '100px', objectFit: 'cover', marginTop: '5px' }} /> : <p style={{ color: '#999', marginTop: '30px' }}>未選択</p>}
              </div>
            )}
            {visibleSlots.bottom && (
              <div style={previewBoxStyle}>
                <div style={{ fontWeight: 'bold', color: '#666' }}>ボトムス</div>
                {selectedBottom ? <img src={selectedBottom.image} alt="Bottom" style={{ width: '100%', height: '100px', objectFit: 'cover', marginTop: '5px' }} /> : <p style={{ color: '#999', marginTop: '30px' }}>未選択</p>}
              </div>
            )}
            {visibleSlots.piece && (
              <div style={previewBoxStyle}>
                <div style={{ fontWeight: 'bold', color: '#666' }}>ワンピース</div>
                {selectedPiece ? <img src={selectedPiece.image} alt="Piece" style={{ width: '100%', height: '100px', objectFit: 'cover', marginTop: '5px' }} /> : <p style={{ color: '#999', marginTop: '30px' }}>未選択</p>}
              </div>
            )}
            {visibleSlots.shoes && (
              <div style={previewBoxStyle}>
                <div style={{ fontWeight: 'bold', color: '#666' }}>シューズ</div>
                {selectedShoes ? <img src={selectedShoes.image} alt="Shoes" style={{ width: '100%', height: '100px', objectFit: 'cover', marginTop: '5px' }} /> : <p style={{ color: '#999', marginTop: '30px' }}>未選択</p>}
              </div>
            )}
            {visibleSlots.accessory && (
              <div style={previewBoxStyle}>
                <div style={{ fontWeight: 'bold', color: '#666' }}>小物・バッグ</div>
                {selectedAccessory ? <img src={selectedAccessory.image} alt="Accessory" style={{ width: '100%', height: '100px', objectFit: 'cover', marginTop: '5px' }} /> : <p style={{ color: '#999', marginTop: '30px' }}>未選択</p>}
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <button onClick={() => { setSelectedOuter(null); setSelectedTop(null); setSelectedBottom(null); setSelectedPiece(null); setSelectedShoes(null); setSelectedAccessory(null); }} style={{ padding: '6px 15px', fontSize: '12px' }}>プレビューをリセット</button>
          </div>

          <hr style={{ border: '0', borderTop: '1px dashed #ccc', margin: '20px 0' }}/>
          
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>この組み合わせをセットとして保存</h4>
            <input 
              type="text" 
              placeholder="セット名を入力 (例: オフィス用)" 
              value={setName} 
              onChange={(e) => setSetName(e.target.value)} 
              style={{ padding: '8px', fontSize: '13px', width: '200px', marginRight: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button onClick={handleSaveSet} style={{ padding: '8px 15px', fontSize: '13px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>セット保存</button>
          </div>

          {/* 保存済みのセット一覧 */}
          {savedSets.length > 0 && (
            <div style={{ marginTop: '25px' }}>
              <h4 style={{ color: '#28a745', borderBottom: '2px solid #28a745', paddingBottom: '5px', marginBottom: '10px' }}>保存済みのセット一覧</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {savedSets.map(set => {
                  const sOuter = clothesList.find(c => c.id === set.outerId);
                  const sTop = clothesList.find(c => c.id === set.topId);
                  const sBottom = clothesList.find(c => c.id === set.bottomId);
                  const sPiece = clothesList.find(c => c.id === set.pieceId);
                  const sShoes = clothesList.find(c => c.id === set.shoesId);
                  const sAccessory = clothesList.find(c => c.id === set.accessoryId);

                  return (
                    <div key={set.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '6px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', color: '#333' }}>{set.name}</div>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {sOuter && <img src={sOuter.image} title="アウター" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc' }} />}
                          {sTop && <img src={sTop.image} title="トップス" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc' }} />}
                          {sBottom && <img src={sBottom.image} title="ボトムス" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc' }} />}
                          {sPiece && <img src={sPiece.image} title="ワンピース" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc' }} />}
                          {sShoes && <img src={sShoes.image} title="シューズ" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc' }} />}
                          {sAccessory && <img src={sAccessory.image} title="小物・バッグ" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc' }} />}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '10px' }}>
                        <button onClick={() => handleLoadSet(set)} style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}>呼び出す</button>
                        <button onClick={() => handleDeleteSet(set.id)} style={{ padding: '4px 12px', fontSize: '11px', color: '#dc3545', border: '1px solid #dc3545', backgroundColor: 'transparent', borderRadius: '3px', cursor: 'pointer' }}>削除</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <form onSubmit={handleAddHistory} style={{ marginBottom: '25px', padding: '15px', border: '1px solid #e67e22', borderRadius: '8px', backgroundColor: '#fff9f4' }}>
          <h3 style={{ marginTop: 0, color: '#d35400' }}>【今日の全身コーデ記録】</h3>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontWeight: 'bold' }}>着た日付: </label>
            <input type="date" value={historyDate} onChange={(e) => setHistoryDate(e.target.value)} style={{ padding: '5px', fontSize: '14px' }} />
          </div>

          <div style={dropZoneStyle(isDragOverHistory)} onDragOver={(e) => { e.preventDefault(); setIsDragOverHistory(true); }} onDragLeave={() => setIsDragOverHistory(false)} onDrop={handleDropHistory} onClick={() => document.getElementById('historyFileInput').click()}>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>全身の写真を<b>ドラッグ＆ドロップ</b>または<b>クリック選択</b></p>
            <input id="historyFileInput" type="file" accept="image/*" onChange={handleHistoryImageChange} style={{ display: 'none' }} />
          </div>

          {historyImage && <div style={{ margin: '10px 0', textAlign: 'center' }}><img src={historyImage} alt="全身" style={{ width: '130px', borderRadius: '6px', border: '1px solid #ccc' }} /></div>}
          
          <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #f39c12', marginBottom: '15px', fontSize: '12px' }}>
            <strong style={{ color: '#e67e22' }}>リンク中のアイテム:</strong>
            <div style={{ display: 'flex', gap: '5px', marginTop: '5px', color: '#666', flexWrap: 'wrap' }}>
              {visibleSlots.outer && selectedOuter && <span>【アウター】</span>}
              {visibleSlots.top && selectedTop && <span>【トップス】</span>}
              {visibleSlots.bottom && selectedBottom && <span>【ボトムス】</span>}
              {visibleSlots.piece && selectedPiece && <span>【ワンピース】</span>}
              {visibleSlots.shoes && selectedShoes && <span>【シューズ】</span>}
              {visibleSlots.accessory && selectedAccessory && <span>【小物・バッグ】</span>}
              {!hasSelectedHistoryItem && <span>選択なし</span>}
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}><input type="text" placeholder="今日の出来事やメモ" value={historyMemo} onChange={(e) => setHistoryMemo(e.target.value)} style={{ width: '95%', padding: '8px', boxSizing: 'border-box' }} /></div>
          <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#e67e22', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>このコーデを履歴に記録する</button>
        </form>
      )}

      <hr style={{ margin: '25px 0', border: '0', borderTop: '2px solid #ddd' }} />

      {activeTab !== 'history' ? (
        <div>
          <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>【クローゼット検索】</h3>
              <button type="button" onClick={() => setIsSearchOpen(!isSearchOpen)} style={{ padding: '4px 10px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #666', backgroundColor: '#fff' }}>
                {isSearchOpen ? '詳細条件を隠す' : '詳細条件を選ぶ'}
              </button>
            </div>
            {isSearchOpen && (
              <div style={{ padding: '10px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '10px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <label>カテゴリ: </label>
                  <select value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)} style={{ padding: '3px' }}>
                    <option value="すべて">すべてのカテゴリ</option><option value="トップス">トップス</option><option value="ボトムス">ボトムス</option><option value="ワンピース">ワンピース</option><option value="アウター">アウター</option><option value="シューズ">シューズ</option><option value="小物・バッグ">小物・バッグ</option>
                  </select>
                  
                  <label style={{ marginLeft: '10px' }}>色: </label>
                  <select value={searchColor} onChange={(e) => setSearchColor(e.target.value)} style={{ padding: '3px' }}>
                    <option value="すべて">すべての色</option>
                    {defaultColors.map(c => <option key={c} value={c}>{c}</option>)}
                    {savedCustomColors.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>季節: </label>
                  <select value={searchSeason} onChange={(e) => setSearchSeason(e.target.value)} style={{ padding: '3px' }}>
                    <option value="すべて">すべての季節</option><option value="通年">通年</option><option value="春夏">春夏（夏物）</option><option value="秋冬">秋冬（冬物）</option><option value="指定なし">指定なし</option>
                  </select>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="メモのキーワードで検索" value={searchWord} onChange={(e) => setSearchWord(e.target.value)} style={{ padding: '8px', flex: 1, boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} />
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}>
                <option value="newest">登録が新しい順</option>
                <option value="color">色順で並べる</option>
              </select>
            </div>
          </div>

          <h3>【該当データ一覧 （{filteredClothes.length}件）】</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
            {filteredClothes.map((item) => {
              const isSelected = 
                item.id === selectedOuter?.id || 
                item.id === selectedTop?.id || 
                item.id === selectedBottom?.id || 
                item.id === selectedPiece?.id || 
                item.id === selectedShoes?.id || 
                item.id === selectedAccessory?.id;
                
              const borderStyle = isSelected ? '3px solid #28a745' : (item.id === editingId ? '2px solid #007bff' : '1px solid #ddd');
              const bgColor = isSelected ? '#f2fff2' : (item.id === editingId ? '#f0f7ff' : '#fff');

              return (
                <div key={item.id} style={{ border: borderStyle, padding: '10px', borderRadius: '6px', textAlign: 'center', backgroundColor: bgColor, position: 'relative' }}>
                  
                  {isSelected && (
                    <div style={{ position: 'absolute', top: '-10px', left: '-10px', backgroundColor: '#28a745', color: '#fff', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      選択中
                    </div>
                  )}

                  <img src={item.image} alt="服" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '5px' }}>{item.category} <span>({item.color})</span></div>
                  <div style={{ fontSize: '11px', color: '#666', minHeight: '32px', margin: '4px 0' }}>{item.memo}</div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    {item.category === 'アウター' && <button onClick={() => selectedOuter?.id === item.id ? setSelectedOuter(null) : setSelectedOuter(item)} style={getSelectButtonStyle(selectedOuter?.id === item.id)}>{selectedOuter?.id === item.id ? '選択中（解除）' : 'アウターに選択'}</button>}
                    {item.category === 'トップス' && <button onClick={() => selectedTop?.id === item.id ? setSelectedTop(null) : setSelectedTop(item)} style={getSelectButtonStyle(selectedTop?.id === item.id)}>{selectedTop?.id === item.id ? '選択中（解除）' : 'トップスに選択'}</button>}
                    {item.category === 'ボトムス' && <button onClick={() => selectedBottom?.id === item.id ? setSelectedBottom(null) : setSelectedBottom(item)} style={getSelectButtonStyle(selectedBottom?.id === item.id)}>{selectedBottom?.id === item.id ? '選択中（解除）' : 'ボトムスに選択'}</button>}
                    {item.category === 'ワンピース' && <button onClick={() => selectedPiece?.id === item.id ? setSelectedPiece(null) : setSelectedPiece(item)} style={getSelectButtonStyle(selectedPiece?.id === item.id)}>{selectedPiece?.id === item.id ? '選択中（解除）' : 'ワンピースに選択'}</button>}
                    {item.category === 'シューズ' && <button onClick={() => selectedShoes?.id === item.id ? setSelectedShoes(null) : setSelectedShoes(item)} style={getSelectButtonStyle(selectedShoes?.id === item.id)}>{selectedShoes?.id === item.id ? '選択中（解除）' : 'シューズに選択'}</button>}
                    {item.category === '小物・バッグ' && <button onClick={() => selectedAccessory?.id === item.id ? setSelectedAccessory(null) : setSelectedAccessory(item)} style={getSelectButtonStyle(selectedAccessory?.id === item.id)}>{selectedAccessory?.id === item.id ? '選択中（解除）' : '小物・バッグに選択'}</button>}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                    <button onClick={() => handleEditStart(item)} style={{ flex: 1, padding: '4px 0', fontSize: '11px', color: '#007bff', border: '1px solid #007bff', borderRadius: '3px', backgroundColor: 'transparent', cursor: 'pointer' }}>編集</button>
                    <button onClick={() => handleDelete(item.id, item.category)} style={{ flex: 1, padding: '4px 0', fontSize: '11px', color: 'red', border: '1px solid red', borderRadius: '3px', backgroundColor: 'transparent', cursor: 'pointer' }}>削除</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <h3>【過去の着用履歴 （{historyList.length}件）】</h3>
          {historyList.length === 0 ? (
            <p style={{ color: '#999', fontSize: '13px' }}>まだ着用履歴はありません。</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {historyList.map((hist) => {
                const linkedOuter = clothesList.find(c => c.id === hist.outerId);
                const linkedTop = clothesList.find(c => c.id === hist.topId);
                const linkedBottom = clothesList.find(c => c.id === hist.bottomId);
                const linkedPiece = clothesList.find(c => c.id === hist.pieceId);
                const linkedShoes = clothesList.find(c => c.id === hist.shoesId);
                const linkedAccessory = clothesList.find(c => c.id === hist.accessoryId);

                return (
                  <div key={hist.id} style={{ display: 'flex', border: '1px solid #e67e22', borderRadius: '8px', padding: '12px', backgroundColor: '#fff' }}>
                    <div style={{ width: '110px', marginRight: '15px', textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#e67e22', color: '#fff', borderRadius: '3px', marginBottom: '5px' }}>{hist.date}</span>
                      <img src={hist.image} alt="全身" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '4px' }} />
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '13px', color: '#333', fontWeight: 'bold', marginBottom: '8px' }}>{hist.memo}</div>
                        <div style={{ marginTop: '5px' }}>
                          <div style={{ fontSize: '11px', color: '#e67e22', fontWeight: 'bold', marginBottom: '3px' }}>着用アイテムリンク:</div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {linkedOuter && <img src={linkedOuter.image} title="アウター" style={{ width: '35px', height: '35px', objectFit: 'cover', border: '1px solid #ccc', borderRadius: '3px' }} />}
                            {linkedTop && <img src={linkedTop.image} title="トップス" style={{ width: '35px', height: '35px', objectFit: 'cover', border: '1px solid #ccc', borderRadius: '3px' }} />}
                            {linkedBottom && <img src={linkedBottom.image} title="ボトムス" style={{ width: '35px', height: '35px', objectFit: 'cover', border: '1px solid #ccc', borderRadius: '3px' }} />}
                            {linkedPiece && <img src={linkedPiece.image} title="ワンピース" style={{ width: '35px', height: '35px', objectFit: 'cover', border: '1px solid #ccc', borderRadius: '3px' }} />}
                            {linkedShoes && <img src={linkedShoes.image} title="シューズ" style={{ width: '35px', height: '35px', objectFit: 'cover', border: '1px solid #ccc', borderRadius: '3px' }} />}
                            {linkedAccessory && <img src={linkedAccessory.image} title="小物・バッグ" style={{ width: '35px', height: '35px', objectFit: 'cover', border: '1px solid #ccc', borderRadius: '3px' }} />}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', marginTop: '10px' }}>
                        <button onClick={() => handleDeleteHistory(hist.id, hist.date)} style={{ padding: '2px 8px', fontSize: '11px', color: 'red', border: '1px solid red', borderRadius: '3px', backgroundColor: 'transparent', cursor: 'pointer' }}>履歴から削除</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
