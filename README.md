# get-advisories

設定したライブラリについて、実行時点から過去24時間以内に公開された GitHub Advisory のURLを標準出力とログファイルへ出力します。取り下げ済みの Advisory は除外します。

## 必要環境

- Node.js 18以上

## 設定

`advisories.config.example.json` を `advisories.config.json` としてコピーし、対象を指定します。

```json
{
  "libraries": [
    { "ecosystem": "npm", "name": "express" },
    { "ecosystem": "pip", "name": "django" }
  ]
}
```

`ecosystem` には GitHub が対応する値（`npm`, `pip`, `maven`, `go`, `rubygems`, `nuget`, `composer`, `rust` など）を指定します。

## 実行

```sh
npm start
```

別の設定ファイルを使う場合:

```sh
node index.js path/to/config.json
```

認証なしでも利用できますが、APIのレート制限を緩和するにはトークンを設定します。

```sh
GITHUB_TOKEN=github_pat_xxx npm start
```

該当する Advisory がない場合、`該当する Advisory はありません。` と出力して正常終了します。

ログはカレントディレクトリの `get-advisories.log` に、UTCのISO 8601 timestamp付きで追記されます。別のファイルを使用する場合は `LOG_FILE` を指定してください。

```sh
LOG_FILE=/path/to/get-advisories.log npm start
```
