# 獵人配裝工房

[開啟 GitHub Pages 網站](https://biubiusmile.github.io/mhn-hunter-forge/)

繁體中文 Monster Hunter Now 配裝模擬器。從 12 個系列的 141 把武器與 60 件防具配置階級 8 Lv.1 裝備，查看基礎數值及技能點數。各裝備旁的「圖鑑」連至遊戲官方資料頁。

## 配裝

1. 選擇武器與五個防具部位。防具依圖鑑的孔位數開放漂流技能，目前收錄八種可選技能。
2. 展開自動配裝，依序指定最多兩個技能與目標點數。搜尋會優先滿足第一項，再滿足第二項，同分時取較高防禦。可鎖定已選防具及其鑲嵌配置。
3. 命名並儲存配裝。「我的配裝」可選兩套比較。分享連結內含整套裝備，接收者可直接載入。

裝備資料取自 [Monster Hunter Now 官方圖鑑](https://monsterhunternow.com/zh/armor)。技能點數顯示累計投入量，可超過遊戲效果上限。攻擊力、屬性值及會心率顯示武器基礎值。此版本未計算戰鬥條件或最終傷害。

## 集會所

「發表至集會所」會開啟已填入配裝連結的 GitHub Issue 草稿。登入 GitHub 後送出即可公開。玩家可在 Issue 下留言或按 👍。網站從最近 100 筆開啟中的 Issues 和 PR 篩出有效配裝，依 👍 數及發表順序顯示前 20 筆。

## 發佈

本專案使用原生 HTML、CSS 和 JavaScript，可直接開啟 index.html。在 GitHub 儲存庫的 Settings → Pages 選擇 Deploy from a branch，指定 main 與根目錄。若 fork 或更名，請一併更新 app.js 與 index.html 中的專案和網站網址。
