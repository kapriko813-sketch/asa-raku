朝ラクローゼット (asaRakuCloset)
クローゼットの洋服情報を管理し、日々のコーディネートの組み合わせ検討や着用履歴の記録をスムーズに行うためのシングルページアプリケーション（SPA）です。

1. ユースケース図 (Use Case Diagram)
ユーザーがこのアプリケーションを通じて実行できる主要な機能を定義しています。

コード スニペット
leftToRightDirection
actor User as "ユーザー"

rectangle "朝ラクローゼット アプリケーション" {
    usecase UC1 as "服を登録する"
    usecase UC2 as "服の情報を編集・削除する"
    usecase UC3 as "クローゼットから服を検索・ソートする"
    usecase UC4 as "コーディネートをプレビューする"
    usecase UC5 as "コーディネートをセットとして保存・呼出・削除する"
    usecase UC6 as "今日の全身コーデ履歴を記録・削除する"
}

User --> UC1
User --> UC2
User --> UC3
User --> UC4
User --> UC5
User --> UC6
2. クラス図 (Class Diagram)
IndexedDB（Dexie）のデータモデルと、Reactコンポーネントにおける状態（State）および主要なビジネスロジックの関係性を表しています。

コード スニペット
classDiagram
    class DexieDatabase {
        +clothes Table
        +history Table
        +sets Table
    }

    class Clothes {
        +int id (PK)
        +string category
        +string memo
        +string image
        +string color
        +string season
        +string sleeve
    }

    class History {
        +int id (PK)
        +string date
        +string image
        +string memo
        +int outerId
        +int topId
        +int bottomId
        +int shoesId
        +int pieceId
        +int accessoryId
    }

    class Set {
        +int id (PK)
        +string name
        +int outerId
        +int topId
        +int bottomId
        +int pieceId
        +int shoesId
        +int accessoryId
    }

    class App_Component {
        <<React Component>>
        -activeTab: string
        -clothesList: Clothes[]
        -historyList: History[]
        -savedSets: Set[]
        -selectedOuter: Clothes
        -selectedTop: Clothes
        -selectedBottom: Clothes
        -selectedPiece: Clothes
        -selectedShoes: Clothes
        -selectedAccessory: Clothes
        +refreshClothes()
        +handleSaveClothes()
        +handleSaveSet()
        +handleLoadSet()
        +handleAddHistory()
        +resizeImage()
    }

    DexieDatabase --> Clothes : stores
    DexieDatabase --> History : stores
    DexieDatabase --> Set : stores
    App_Component ..> DexieDatabase : CRUD Operations
3. 協調図 / コミュニケーション図 (Communication Diagram)
服をクローゼットに登録する、またはコーディネートセットを呼び出す際の関係オブジェクト間の相互作用を示しています。

例：コーディネートセットの保存と呼び出し時
コード スニペット
graph TD
    User["1: ユーザー (User)"] -->|1. セット名入力 & 保存操作| App["2: Appコンポーネント (React State)"]
    App -->|2. セット情報を保存 (db.sets.add)| DB[("3: データベース (Dexie/IndexedDB)")]
    DB -->|3. 最新のセット一覧を返却| App
    User -->|4. セット呼び出し操作| App
    App -->|5. 各スロットの状態を更新 (setSelectedTop等)| App
4. 状態遷移図 (State Transition Diagram)
アプリケーションの画面（タブ）切り替えと、「服の登録・編集フォーム」におけるモードの遷移を表しています。

コード スニペット
stateDiagram-v2
    [*] --> RegisterMode_New : 初期起動 (「服を登録」タブ)

    state "「服を登録」タブ" as TabRegister {
        RegisterMode_New --> RegisterMode_Edit : 該当データ一覧で「編集」をクリック
        RegisterMode_Edit --> RegisterMode_New : 「キャンセル」または「保存」完了
    }

    state "「組み合わせ」タブ" as TabPreview {
        [*] --> Preview_Idle
        Preview_Idle --> SlotSelected : アイテム選択 / セット呼び出し
        SlotSelected --> Preview_Idle : プレビューをリセット
    }

    state "「今日着た服」タブ" as TabHistory {
        [*] --> History_Input
        History_Input --> History_Input : 履歴の記録成功 / 削除
    }

    %% タブ間の遷移
    TabRegister --> TabPreview : タブ切り替え
    TabPreview --> TabHistory : タブ切り替え
    TabHistory --> TabRegister : タブ切り替え
