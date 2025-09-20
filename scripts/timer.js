/**
 * TimerApp - シンプルなカウントダウンタイマーアプリケーション
 */
class TimerApp {
  constructor() {
    // 基本プロパティの初期化
    this.minutes = 0;
    this.seconds = 0;
    this.totalSeconds = 0;
    this.remainingSeconds = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.intervalId = null;
    
    // タイマー状態の定義
    this.TimerState = {
      IDLE: 'idle',
      RUNNING: 'running',
      PAUSED: 'paused',
      COMPLETED: 'completed'
    };
    
    this.currentState = this.TimerState.IDLE;
    
    // 設定オブジェクト
    this.config = {
      maxMinutes: 99,
      maxSeconds: 59,
      tickInterval: 1000,
      alarmDuration: 3000,
      completionMessage: 'タイマー完了！'
    };
    
    // 音声関連の初期化
    this.audioContext = null;
    
    // 入力フィールド更新用のタイムアウト
    this.inputUpdateTimeout = null;
    
    // エラーハンドリングと安定性向上のためのプロパティ
    this.lastTickTime = null; // 最後のtick実行時刻
    this.isTabActive = true; // タブがアクティブかどうか
    this.startAttempts = 0; // 開始試行回数（重複開始防止用）
    this.maxStartAttempts = 1; // 最大開始試行回数
    
    // DOM要素の参照を取得
    this.initializeElements();
    
    // 初期表示を更新
    this.updateDisplay();
    
    // 初期ボタン状態を設定
    this.updateButtonStates();
    
    // デバッグ: 初期化後の入力フィールド状態を確認
    setTimeout(() => {
      if (this.minutesInput && this.secondsInput) {
        console.log('=== 初期化後の入力フィールド状態 ===');
        console.log('分入力フィールド disabled:', this.minutesInput.disabled);
        console.log('秒入力フィールド disabled:', this.secondsInput.disabled);
        console.log('分入力フィールド tabIndex:', this.minutesInput.tabIndex);
        console.log('秒入力フィールド tabIndex:', this.secondsInput.tabIndex);
        console.log('タイマー状態 - isRunning:', this.isRunning, 'isPaused:', this.isPaused);
      }
    }, 100);
    
    // ブラウザタブの可視性変更を監視
    this.setupVisibilityChangeHandling();
    
    // ページ離脱時のクリーンアップを設定
    this.setupPageUnloadHandling();
  }
  
  /**
   * DOM要素の参照を初期化
   */
  initializeElements() {
    // タイマー表示要素
    this.displayElement = document.querySelector('#timeDisplay');
    
    // 入力要素
    this.minutesInput = document.querySelector('#minutesInput');
    this.secondsInput = document.querySelector('#secondsInput');
    
    // 制御ボタン要素
    this.startPauseButton = document.querySelector('#startPauseBtn');
    this.resetButton = document.querySelector('#resetBtn');
    
    // 状態表示要素
    this.statusElement = document.querySelector('#statusMessage');
    
    // メインコンテナ
    this.containerElement = document.querySelector('.timer-container');
    
    // 入力フィールドのフォーカス可能性を確保
    if (this.minutesInput) {
      this.minutesInput.tabIndex = 0;
      this.minutesInput.disabled = false;
    }
    if (this.secondsInput) {
      this.secondsInput.tabIndex = 0;
      this.secondsInput.disabled = false;
    }
    
    // イベントリスナーを設定
    this.setupEventListeners();
  }
  
  /**
   * イベントリスナーを設定する
   * 要件: 2.1, 2.2, 2.3, 3.3
   */
  setupEventListeners() {
    // 開始/一時停止ボタンのクリックイベント
    if (this.startPauseButton) {
      this.startPauseButton.addEventListener('click', () => {
        this.handleStartPauseClick();
      });
    }
    
    // リセットボタンのクリックイベント
    if (this.resetButton) {
      this.resetButton.addEventListener('click', () => {
        this.handleResetClick();
      });
    }
    
    // 入力フィールドのイベントリスナーを設定
    this.setupInputFieldListeners();
    
    // キーボード操作のイベントリスナーを設定
    this.setupKeyboardListeners();
  }
  
  /**
   * 入力フィールドのイベントリスナーを設定する
   * 要件: 1.1, 1.2, 1.4 - 入力フィールドの検証とフォーマット機能
   */
  setupInputFieldListeners() {
    // 分入力フィールドのイベント
    if (this.minutesInput) {
      // リアルタイム入力値検証（要件: 1.1, 1.4）
      this.minutesInput.addEventListener('input', (event) => {
        this.handleInputValidation(event, 'minutes');
      });
      
      // フォーカス時の処理
      this.minutesInput.addEventListener('focus', (event) => {
        this.handleInputFocus(event, 'minutes');
      });
      
      // ブラー時の処理（要件: 1.1, 1.4）
      this.minutesInput.addEventListener('blur', (event) => {
        this.handleInputBlur(event, 'minutes');
      });
      
      // キーダウンイベント（特殊キーの処理）
      this.minutesInput.addEventListener('keydown', (event) => {
        this.handleInputKeydown(event, 'minutes');
      });
      
      // ペーストイベント
      this.minutesInput.addEventListener('paste', (event) => {
        this.handleInputPaste(event, 'minutes');
      });
    }
    
    // 秒入力フィールドのイベント
    if (this.secondsInput) {
      // リアルタイム入力値検証（要件: 1.2, 1.4）
      this.secondsInput.addEventListener('input', (event) => {
        this.handleInputValidation(event, 'seconds');
      });
      
      // フォーカス時の処理
      this.secondsInput.addEventListener('focus', (event) => {
        this.handleInputFocus(event, 'seconds');
      });
      
      // ブラー時の処理（要件: 1.2, 1.4）
      this.secondsInput.addEventListener('blur', (event) => {
        this.handleInputBlur(event, 'seconds');
      });
      
      // キーダウンイベント（特殊キーの処理）
      this.secondsInput.addEventListener('keydown', (event) => {
        this.handleInputKeydown(event, 'seconds');
      });
      
      // ペーストイベント
      this.secondsInput.addEventListener('paste', (event) => {
        this.handleInputPaste(event, 'seconds');
      });
    }
  }
  
  /**
   * キーボード操作のイベントリスナーを設定する
   * 要件: 3.1, 3.3, 3.4 - キーボード操作対応（Enter、Spaceキーでのボタン操作）
   */
  setupKeyboardListeners() {
    // グローバルキーボードイベントリスナー
    document.addEventListener('keydown', (event) => {
      this.handleGlobalKeydown(event);
    });
    
    // ボタンのキーボードイベント
    if (this.startPauseButton) {
      this.startPauseButton.addEventListener('keydown', (event) => {
        this.handleButtonKeydown(event, 'startPause');
      });
    }
    
    if (this.resetButton) {
      this.resetButton.addEventListener('keydown', (event) => {
        this.handleButtonKeydown(event, 'reset');
      });
    }
  }
  
  /**
   * グローバルキーボードイベントの処理
   * 要件: 3.1, 3.3, 3.4 - キーボード操作対応
   * @param {KeyboardEvent} event - キーボードイベント
   */
  handleGlobalKeydown(event) {
    // 入力フィールドにフォーカスがある場合は、グローバルキーボードショートカットを無効にする
    const activeElement = document.activeElement;
    if (activeElement && (activeElement === this.minutesInput || activeElement === this.secondsInput)) {
      return;
    }
    
    // Enterキーまたはスペースキーでタイマー開始/一時停止
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleStartPauseClick();
      
      // フォーカスを開始/一時停止ボタンに移動
      if (this.startPauseButton) {
        this.startPauseButton.focus();
      }
    }
    
    // Rキーでリセット
    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      this.handleResetClick();
      
      // フォーカスをリセットボタンに移動
      if (this.resetButton) {
        this.resetButton.focus();
      }
    }
    
    // Escapeキーでタイマーを一時停止
    if (event.key === 'Escape' && this.isRunning) {
      event.preventDefault();
      this.pause();
      this.updateButtonStates();
    }
    
    // 数字キー1-9で時間設定（分入力フィールドにフォーカス）
    if (/^[1-9]$/.test(event.key) && !this.isRunning && !this.isPaused) {
      event.preventDefault();
      if (this.minutesInput) {
        // 確実にフォーカス可能にする
        this.minutesInput.disabled = false;
        this.minutesInput.tabIndex = 0;
        
        // フォーカスを設定
        this.minutesInput.focus();
        
        // 値を設定
        this.minutesInput.value = event.key;
        this.handleInputValidation({ target: this.minutesInput }, 'minutes');
        
        // フォーカスが設定されたことをアナウンス
        this.announceToScreenReader(`分入力フィールドに${event.key}を設定しました`, 'polite');
      }
    }
  }
  
  /**
   * ボタンのキーボードイベント処理
   * 要件: 3.1, 3.3, 3.4 - キーボード操作対応
   * @param {KeyboardEvent} event - キーボードイベント
   * @param {string} buttonType - ボタンの種類（'startPause' または 'reset'）
   */
  handleButtonKeydown(event, buttonType) {
    // EnterキーまたはSpaceキーでボタンを実行
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      
      if (buttonType === 'startPause') {
        this.handleStartPauseClick();
      } else if (buttonType === 'reset') {
        this.handleResetClick();
      }
    }
  }
  
  /**
   * 開始/一時停止ボタンのクリック処理
   * 要件: 2.1, 2.2, 2.4
   */
  handleStartPauseClick() {
    if (this.isRunning) {
      // 動作中の場合は一時停止（要件2.2）
      this.pause();
    } else {
      // 停止中の場合は開始（要件2.1, 2.4）
      if (this.isPaused) {
        // 一時停止中からの再開（要件2.4）
        this.start();
      } else {
        // 新規開始の場合は入力値を設定してから開始
        this.handleTimeInputChange();
        this.start();
      }
    }
    
    // ボタン状態を更新
    this.updateButtonStates();
  }
  
  /**
   * リセットボタンのクリック処理
   * 要件: 2.3
   */
  handleResetClick() {
    this.reset();
    // ボタン状態を更新
    this.updateButtonStates();
  }
  
  /**
   * 時間入力フィールドの変更処理
   * 要件: 1.1, 1.2, 1.3, 1.4
   */
  handleTimeInputChange() {
    // タイマーが動作中でない場合のみ時間設定を更新
    if (!this.isRunning) {
      const minutes = this.minutesInput ? this.minutesInput.value : 0;
      const seconds = this.secondsInput ? this.secondsInput.value : 0;
      this.setTime(minutes, seconds);
      
      // ボタン状態を更新
      this.updateButtonStates();
    }
  }
  
  /**
   * 入力フィールドのリアルタイム検証処理
   * 要件: 1.1, 1.2, 1.4 - リアルタイム入力値検証、数値以外の文字の自動除去
   * @param {Event} event - 入力イベント
   * @param {string} type - 'minutes' または 'seconds'
   */
  handleInputValidation(event, type) {
    const input = event.target;
    const originalValue = input.value;
    const cursorPosition = input.selectionStart;
    
    // 数値以外の文字を自動除去（要件: 数値以外の文字の自動除去機能）
    let cleanedValue = this.sanitizeNumericInput(originalValue);
    
    // 値が変更された場合は更新
    if (cleanedValue !== originalValue) {
      input.value = cleanedValue;
      
      // カーソル位置を調整（削除された文字数分だけ戻す）
      const deletedChars = originalValue.length - cleanedValue.length;
      const newCursorPosition = Math.max(0, cursorPosition - deletedChars);
      input.setSelectionRange(newCursorPosition, newCursorPosition);
    }
    
    // 範囲チェックと制限
    const numericValue = parseInt(cleanedValue, 10) || 0;
    let maxValue;
    
    if (type === 'minutes') {
      maxValue = this.config.maxMinutes; // 99分まで（要件: 1.1）
    } else if (type === 'seconds') {
      maxValue = 999; // 秒は繰り上げ処理があるため、大きな値も一時的に許可
    }
    
    // 最大値を超えた場合の処理
    if (numericValue > maxValue) {
      input.value = maxValue.toString();
    }
    
    // タイマーが動作中でない場合のみ時間設定を更新
    if (!this.isRunning && !this.isPaused) {
      // 少し遅延させて連続入力時のパフォーマンスを向上
      clearTimeout(this.inputUpdateTimeout);
      this.inputUpdateTimeout = setTimeout(() => {
        this.handleTimeInputChange();
      }, 100);
    }
  }
  
  /**
   * 入力フィールドのフォーカス時処理
   * 要件: 1.1, 1.2 - 入力フィールドのフォーカス時の処理
   * @param {Event} event - フォーカスイベント
   * @param {string} type - 'minutes' または 'seconds'
   */
  handleInputFocus(event, type) {
    const input = event.target;
    
    // フォーカス時に全選択（ユーザビリティ向上）
    setTimeout(() => {
      input.select();
    }, 0);
    
    // フォーカス時のスタイル適用
    input.classList.add('focused');
    
    // 0の場合は空にして入力しやすくする
    if (input.value === '0') {
      input.value = '';
    }
  }
  
  /**
   * 入力フィールドのブラー時処理
   * 要件: 1.1, 1.2, 1.4 - 入力フィールドのブラー時の処理
   * @param {Event} event - ブラーイベント
   * @param {string} type - 'minutes' または 'seconds'
   */
  handleInputBlur(event, type) {
    const input = event.target;
    
    // フォーカススタイルを削除
    input.classList.remove('focused');
    
    // 空の場合はデフォルト値0を設定（要件: 1.4）
    if (input.value === '' || input.value === null || input.value === undefined) {
      input.value = '0';
    }
    
    // 最終的な値の検証とフォーマット
    const cleanedValue = this.sanitizeNumericInput(input.value);
    const numericValue = parseInt(cleanedValue, 10) || 0;
    
    // タイプ別の範囲チェック
    let finalValue = numericValue;
    if (type === 'minutes') {
      // 0-99分の範囲チェック（要件: 1.1）
      finalValue = Math.min(Math.max(0, numericValue), this.config.maxMinutes);
    } else if (type === 'seconds') {
      // 秒は負の値のみチェック（繰り上げは setTime で処理）
      finalValue = Math.max(0, numericValue);
    }
    
    // フォーマットされた値を設定
    input.value = finalValue.toString();
    
    // タイマーが動作中でない場合のみ時間設定を更新
    if (!this.isRunning && !this.isPaused) {
      this.handleTimeInputChange();
    }
  }
  
  /**
   * キーダウンイベントの処理
   * @param {Event} event - キーダウンイベント
   * @param {string} type - 'minutes' または 'seconds'
   */
  handleInputKeydown(event, type) {
    const key = event.key;
    
    // 許可するキー: 数字、Backspace、Delete、Tab、Enter、Arrow keys
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];
    
    // 数字キー（0-9）
    const isNumericKey = /^[0-9]$/.test(key);
    
    // Ctrl/Cmd + A, C, V, X (全選択、コピー、ペースト、カット)
    const isCtrlKey = event.ctrlKey || event.metaKey;
    const isAllowedCtrlKey = isCtrlKey && ['a', 'c', 'v', 'x'].includes(key.toLowerCase());
    
    // 許可されないキーの場合はイベントをキャンセル
    if (!isNumericKey && !allowedKeys.includes(key) && !isAllowedCtrlKey) {
      event.preventDefault();
      return;
    }
    
    // Enterキーでタイマー開始
    if (key === 'Enter' && !this.isRunning && !this.isPaused) {
      event.preventDefault();
      this.handleStartPauseClick();
    }
  }
  
  /**
   * ペーストイベントの処理
   * @param {Event} event - ペーストイベント
   * @param {string} type - 'minutes' または 'seconds'
   */
  handleInputPaste(event, type) {
    // ペーストされるデータを取得
    const pasteData = (event.clipboardData || window.clipboardData).getData('text');
    
    // 数値以外の文字を除去
    const cleanedData = this.sanitizeNumericInput(pasteData);
    
    // 元のペーストをキャンセル
    event.preventDefault();
    
    // クリーンなデータを設定
    if (cleanedData !== '') {
      const input = event.target;
      const numericValue = parseInt(cleanedData, 10) || 0;
      
      // 範囲チェック
      let maxValue;
      if (type === 'minutes') {
        maxValue = this.config.maxMinutes;
      } else if (type === 'seconds') {
        maxValue = 999; // 秒は繰り上げ処理があるため大きな値も一時的に許可
      }
      
      const finalValue = Math.min(numericValue, maxValue);
      input.value = finalValue.toString();
      
      // 時間設定を更新
      if (!this.isRunning && !this.isPaused) {
        this.handleTimeInputChange();
      }
    }
  }
  
  /**
   * 数値入力の清浄化処理
   * 要件: 数値以外の文字の自動除去機能を実装
   * @param {string} input - 入力文字列
   * @returns {string} - 数値のみの文字列
   */
  sanitizeNumericInput(input) {
    if (typeof input !== 'string') {
      input = String(input);
    }
    
    // 数値以外の文字を除去（要件: 数値以外の文字の自動除去機能）
    return input.replace(/[^0-9]/g, '');
  }
  
  /**
   * ボタンの状態と表示を更新する
   * 要件: 2.1, 2.2, 2.3, 3.3
   */
  updateButtonStates() {
    if (!this.startPauseButton || !this.resetButton) {
      return;
    }
    
    // 開始/一時停止ボタンの動的テキスト変更（要件3.3）
    if (this.isRunning) {
      // 動作中の場合は「一時停止」表示
      this.startPauseButton.textContent = '一時停止';
      this.startPauseButton.setAttribute('aria-label', 'タイマーを一時停止します。Enterキーまたはスペースキーで実行できます。');
      this.startPauseButton.setAttribute('aria-pressed', 'true');
      this.startPauseButton.classList.remove('primary-btn');
      this.startPauseButton.classList.add('pause-btn');
    } else if (this.isPaused) {
      // 一時停止中の場合は「再開」表示
      this.startPauseButton.textContent = '再開';
      this.startPauseButton.setAttribute('aria-label', 'タイマーを再開します。Enterキーまたはスペースキーで実行できます。');
      this.startPauseButton.setAttribute('aria-pressed', 'false');
      this.startPauseButton.classList.remove('pause-btn');
      this.startPauseButton.classList.add('primary-btn');
    } else {
      // 停止中の場合は「開始」表示
      this.startPauseButton.textContent = '開始';
      this.startPauseButton.setAttribute('aria-label', 'タイマーを開始します。Enterキーまたはスペースキーで実行できます。');
      this.startPauseButton.setAttribute('aria-pressed', 'false');
      this.startPauseButton.classList.remove('pause-btn');
      this.startPauseButton.classList.add('primary-btn');
    }
    
    // ボタンの有効/無効状態を設定
    const hasTime = this.totalSeconds > 0 || this.remainingSeconds > 0;
    
    // 開始/一時停止ボタンの有効性
    if (this.isRunning || (hasTime && !this.isRunning)) {
      this.startPauseButton.disabled = false;
      this.startPauseButton.classList.remove('disabled');
      this.startPauseButton.removeAttribute('aria-disabled');
    } else {
      this.startPauseButton.disabled = true;
      this.startPauseButton.classList.add('disabled');
      this.startPauseButton.setAttribute('aria-disabled', 'true');
      this.startPauseButton.setAttribute('aria-label', '時間を設定してからタイマーを開始してください');
    }
    
    // リセットボタンの有効性とARIA属性
    this.resetButton.disabled = false; // リセットボタンは常に有効
    this.resetButton.classList.remove('disabled');
    this.resetButton.removeAttribute('aria-disabled');
    this.resetButton.setAttribute('aria-label', 'タイマーをリセットします。Rキーでも実行できます。');
    
    // 入力フィールドの有効性とARIA属性
    if (this.minutesInput && this.secondsInput) {
      // 入力フィールドは動作中または一時停止中は無効、IDLEまたはCOMPLETED状態でのみ有効
      const inputsDisabled = this.isRunning || this.isPaused;
      
      // 確実にdisabled属性を設定/削除
      if (inputsDisabled) {
        this.minutesInput.disabled = true;
        this.secondsInput.disabled = true;
        this.minutesInput.classList.add('disabled');
        this.secondsInput.classList.add('disabled');
        this.minutesInput.setAttribute('aria-disabled', 'true');
        this.secondsInput.setAttribute('aria-disabled', 'true');
        this.minutesInput.setAttribute('aria-describedby', 'inputDisabledMessage');
        this.secondsInput.setAttribute('aria-describedby', 'inputDisabledMessage');
      } else {
        this.minutesInput.disabled = false;
        this.secondsInput.disabled = false;
        this.minutesInput.classList.remove('disabled');
        this.secondsInput.classList.remove('disabled');
        this.minutesInput.removeAttribute('aria-disabled');
        this.secondsInput.removeAttribute('aria-disabled');
        this.minutesInput.setAttribute('aria-describedby', 'minutesHelp');
        this.secondsInput.setAttribute('aria-describedby', 'secondsHelp');
        
        // フォーカス可能であることを確認
        this.minutesInput.tabIndex = 0;
        this.secondsInput.tabIndex = 0;
      }
    }
  }
  
  /**
   * 時間設定機能 - 分と秒を設定し、入力値検証を行う
   * 要件: 1.1, 1.2, 1.3, 1.4
   * @param {number|string} inputMinutes - 設定する分数
   * @param {number|string} inputSeconds - 設定する秒数
   * @returns {boolean} - 設定が成功したかどうか
   */
  setTime(inputMinutes, inputSeconds) {
    // 入力値を数値に変換（無効な値は0になる）
    let minutes = this.validateAndParseInput(inputMinutes, 'minutes');
    let seconds = this.validateAndParseInput(inputSeconds, 'seconds');
    
    // 秒が60以上の場合、分に繰り上げ処理（要件1.3）
    if (seconds >= 60) {
      const additionalMinutes = Math.floor(seconds / 60);
      minutes += additionalMinutes;
      seconds = seconds % 60;
    }
    
    // 分の最大値チェック（0-99分の範囲チェック）
    if (minutes > this.config.maxMinutes) {
      minutes = this.config.maxMinutes;
    }
    
    // 値を設定
    this.minutes = minutes;
    this.seconds = seconds;
    this.totalSeconds = (minutes * 60) + seconds;
    this.remainingSeconds = this.totalSeconds;
    
    // 入力フィールドに正規化された値を反映
    if (this.minutesInput) {
      this.minutesInput.value = minutes;
    }
    if (this.secondsInput) {
      this.secondsInput.value = seconds;
    }
    
    // 表示を更新（要件3.1）
    this.updateDisplay();
    
    return true;
  }
  
  /**
   * 入力値の検証と解析を行う
   * 要件: 1.1, 1.2, 1.4
   * @param {number|string} input - 検証する入力値
   * @param {string} type - 'minutes' または 'seconds'
   * @returns {number} - 検証済みの数値
   */
  validateAndParseInput(input, type) {
    // null, undefined, 空文字の場合はデフォルト値0を返す（要件1.4）
    if (input === null || input === undefined || input === '') {
      return 0;
    }
    
    // 文字列の場合、数値以外の文字を除去
    if (typeof input === 'string') {
      input = input.replace(/[^0-9]/g, '');
      if (input === '') {
        return 0; // 数値が含まれていない場合はデフォルト値0
      }
    }
    
    // 数値に変換
    const numValue = parseInt(input, 10);
    
    // NaNの場合はデフォルト値0を返す（要件1.4）
    if (isNaN(numValue)) {
      return 0;
    }
    
    // 負の値の場合は0にリセット
    if (numValue < 0) {
      return 0;
    }
    
    // タイプ別の範囲チェック
    if (type === 'minutes') {
      // 0-99分の範囲チェック（要件1.1）
      return Math.min(numValue, this.config.maxMinutes);
    } else if (type === 'seconds') {
      // 0-59秒の範囲チェック（要件1.2）
      // ただし、60以上の場合は繰り上げ処理で対応するため、ここでは制限しない
      return numValue;
    }
    
    return numValue;
  }
  
  /**
   * タイマー表示を更新する - MM:SS形式での時間表示
   * 要件: 3.1, 3.2, 3.3
   */
  updateDisplay() {
    if (!this.displayElement) {
      console.warn('Display element not found');
      return;
    }
    
    // 残り時間から分と秒を計算
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    
    // MM:SS形式でフォーマット（要件3.1）
    const formattedTime = this.formatTime(minutes, seconds);
    
    // 表示を更新
    this.displayElement.textContent = formattedTime;
    
    // スクリーンリーダー用の詳細な時間情報を設定
    const minutesText = minutes === 1 ? '1分' : `${minutes}分`;
    const secondsText = seconds === 1 ? '1秒' : `${seconds}秒`;
    let ariaLabel = `残り時間: ${minutesText}${secondsText}`;
    
    // タイマー状態に応じたARIA情報を追加
    switch (this.currentState) {
      case this.TimerState.RUNNING:
        ariaLabel += '、動作中';
        break;
      case this.TimerState.PAUSED:
        ariaLabel += '、一時停止中';
        break;
      case this.TimerState.COMPLETED:
        ariaLabel += '、完了';
        break;
      case this.TimerState.IDLE:
      default:
        ariaLabel += '、停止中';
        break;
    }
    
    this.displayElement.setAttribute('aria-label', ariaLabel);
    
    // 状態に応じた色変更（要件3.3）
    this.updateDisplayState();
  }
  
  /**
   * 時間をMM:SS形式でフォーマットする
   * @param {number} minutes - 分
   * @param {number} seconds - 秒
   * @returns {string} - フォーマットされた時間文字列
   */
  formatTime(minutes, seconds) {
    const paddedMinutes = minutes.toString().padStart(2, '0');
    const paddedSeconds = seconds.toString().padStart(2, '0');
    return `${paddedMinutes}:${paddedSeconds}`;
  }
  
  /**
   * 表示要素の状態クラスを更新する
   * 要件: 3.2, 3.3
   */
  updateDisplayState() {
    if (!this.displayElement) {
      return;
    }
    
    // 既存の状態クラスを削除
    this.displayElement.classList.remove('running', 'paused', 'completed');
    
    // 現在の状態に応じてクラスを追加（要件3.3）
    switch (this.currentState) {
      case this.TimerState.RUNNING:
        this.displayElement.classList.add('running');
        break;
      case this.TimerState.PAUSED:
        this.displayElement.classList.add('paused');
        break;
      case this.TimerState.COMPLETED:
        this.displayElement.classList.add('completed');
        break;
      case this.TimerState.IDLE:
      default:
        // IDLEの場合はデフォルトスタイル（クラスなし）
        break;
    }
  }
  
  /**
   * タイマーを開始する - カウントダウン開始機能
   * 要件: 2.1, 2.4
   */
  start() {
    // 重複開始防止ロジック - 開始試行回数をチェック
    if (this.startAttempts >= this.maxStartAttempts) {
      console.warn('重複開始が検出されました。タイマーは既に開始処理中です。');
      return false;
    }
    
    // 開始試行回数を増加
    this.startAttempts++;
    
    try {
      // 既に動作中の場合は重複開始を防止
      if (this.isRunning) {
        console.warn('Timer is already running');
        return false;
      }
      
      // 0:00での開始試行時の処理 - エラーメッセージを表示
      if (this.remainingSeconds <= 0) {
        console.warn('Cannot start timer with 0:00');
        this.showErrorMessage('時間を設定してからタイマーを開始してください。');
        return false;
      }
      
      // 既存のintervalが残っている場合は確実にクリア
      this.clearAllTimers();
      
      // 再開かどうかを判定（状態更新前に）
      const isResuming = this.isPaused;
      
      // タイマー状態を更新
      this.isRunning = true;
      this.isPaused = false;
      this.currentState = this.TimerState.RUNNING;
      this.lastTickTime = Date.now(); // 最後のtick時刻を記録
      
      // カウントダウンを開始（要件2.1）
      this.intervalId = setInterval(() => {
        this.tick();
      }, this.config.tickInterval);
      
      // 表示を更新
      this.updateDisplay();
      
      // ボタン状態を更新
      this.updateButtonStates();
      
      // スクリーンリーダーにアナウンス
      const action = isResuming ? 'resume' : 'start';
      this.announceTimerStateChange(action);
      
      console.log('タイマーが開始されました');
      return true;
      
    } catch (error) {
      console.error('タイマー開始中にエラーが発生しました:', error);
      this.showErrorMessage('タイマーの開始に失敗しました。');
      return false;
    } finally {
      // 開始試行回数をリセット（成功・失敗に関わらず）
      setTimeout(() => {
        this.startAttempts = 0;
      }, 100);
    }
  }
  
  /**
   * タイマーを一時停止する - タイマー一時停止機能
   * 要件: 2.2
   */
  pause() {
    try {
      // 動作中でない場合は何もしない
      if (!this.isRunning) {
        console.warn('Timer is not running');
        return false;
      }
      
      // すべてのタイマーを適切にクリア
      this.clearAllTimers();
      
      // タイマー状態を更新（要件2.2）
      this.isRunning = false;
      this.isPaused = true;
      this.currentState = this.TimerState.PAUSED;
      this.lastTickTime = null; // tick時刻をリセット
      
      // 表示を更新
      this.updateDisplay();
      
      // ボタン状態を更新
      this.updateButtonStates();
      
      // スクリーンリーダーにアナウンス
      this.announceTimerStateChange('pause');
      
      console.log('タイマーが一時停止されました');
      return true;
      
    } catch (error) {
      console.error('タイマー一時停止中にエラーが発生しました:', error);
      this.showErrorMessage('タイマーの一時停止に失敗しました。');
      return false;
    }
  }
  
  /**
   * カウントダウンのティック処理 - 1秒ごとの時間減算
   * 要件: 2.1, 2.4
   */
  tick() {
    try {
      // タイマーが動作中でない場合は処理を停止
      if (!this.isRunning) {
        console.warn('Tick called but timer is not running');
        this.clearAllTimers();
        return;
      }
      
      // ブラウザタブ非アクティブ時の動作を考慮した実装
      const currentTime = Date.now();
      if (this.lastTickTime && !this.isTabActive) {
        // タブが非アクティブだった期間を計算
        const timeDiff = currentTime - this.lastTickTime;
        const missedTicks = Math.floor(timeDiff / this.config.tickInterval);
        
        if (missedTicks > 1) {
          // 複数のtickが抜けた場合は、その分を一度に減算
          console.log(`タブ非アクティブ期間中に${missedTicks}秒経過しました`);
          this.remainingSeconds -= missedTicks;
        } else {
          // 通常の1秒減算
          this.remainingSeconds--;
        }
      } else {
        // 通常の1秒減算
        this.remainingSeconds--;
      }
      
      // 最後のtick時刻を更新
      this.lastTickTime = currentTime;
      
      // 残り時間が負の値になった場合は0に調整
      if (this.remainingSeconds < 0) {
        this.remainingSeconds = 0;
      }
      
      // 表示を更新（要件3.1 - リアルタイム表示）
      this.updateDisplay();
      
      // タイマー完了チェック
      if (this.remainingSeconds <= 0) {
        this.complete();
      }
      
    } catch (error) {
      console.error('Tick処理中にエラーが発生しました:', error);
      // エラーが発生した場合はタイマーを安全に停止
      this.pause();
      this.showErrorMessage('タイマー動作中にエラーが発生しました。');
    }
  }
  
  /**
   * タイマー完了処理
   * 要件: 4.1, 4.2, 4.3
   */
  complete() {
    try {
      // すべてのタイマーを適切にクリア
      this.clearAllTimers();
      
      // タイマー状態を更新
      this.isRunning = false;
      this.isPaused = false;
      this.currentState = this.TimerState.COMPLETED;
      this.remainingSeconds = 0;
      this.lastTickTime = null; // tick時刻をリセット
      
      // 表示を更新
      this.updateDisplay();
      
      // ボタン状態を更新
      this.updateButtonStates();
      
      // 完了通知機能を実行
      this.showCompletionNotification();
      this.changeBackgroundOnCompletion();
      this.playAlarm();
      
      // スクリーンリーダーにアナウンス
      this.announceTimerStateChange('complete');
      
      console.log('タイマーが完了しました');
      
    } catch (error) {
      console.error('タイマー完了処理中にエラーが発生しました:', error);
      this.showErrorMessage('タイマー完了処理でエラーが発生しました。');
    }
  }
  
  /**
   * 完了メッセージを表示する
   * 要件: 4.2
   */
  showCompletionNotification() {
    if (this.statusElement) {
      this.statusElement.textContent = this.config.completionMessage;
      this.statusElement.classList.add('completion');
      
      // ARIA live regionで完了を通知
      this.statusElement.setAttribute('aria-live', 'assertive');
    }
  }
  
  /**
   * 完了時の背景色変更機能
   * 要件: 4.3
   */
  changeBackgroundOnCompletion() {
    if (this.containerElement) {
      this.containerElement.classList.add('timer-completed');
    }
  }
  
  /**
   * タイマーをリセットする - 初期時間への復帰機能
   * 要件: 2.3
   */
  reset() {
    try {
      // すべてのタイマーを適切にクリア（タイマー状態のクリア処理）
      this.clearAllTimers();
      
      // タイマー状態をリセット（要件2.3）
      this.isRunning = false;
      this.isPaused = false;
      this.currentState = this.TimerState.IDLE;
      this.lastTickTime = null; // tick時刻をリセット
      this.startAttempts = 0; // 開始試行回数をリセット
      
      // 残り時間を設定された初期時間に戻す（要件2.3）
      this.remainingSeconds = this.totalSeconds;
      
      // 表示の初期化処理（要件2.3）
      this.updateDisplay();
      
      // ボタン状態を更新
      this.updateButtonStates();
      
      // 完了状態をクリア
      this.clearCompletionState();
      
      // スクリーンリーダーにアナウンス
      this.announceTimerStateChange('reset');
      
      console.log('タイマーがリセットされました');
      return true;
      
    } catch (error) {
      console.error('タイマーリセット中にエラーが発生しました:', error);
      this.showErrorMessage('タイマーのリセットに失敗しました。');
      return false;
    }
  }
  
  /**
   * 完了状態をクリアする
   * 要件: 4.4 (完了通知が表示された後、ユーザーはリセットボタンで通常状態に戻せる)
   */
  clearCompletionState() {
    // 状態メッセージをクリア
    if (this.statusElement) {
      this.statusElement.textContent = '';
      this.statusElement.classList.remove('completion');
      this.statusElement.setAttribute('aria-live', 'polite');
    }
    
    // 背景色を通常状態に戻す
    if (this.containerElement) {
      this.containerElement.classList.remove('timer-completed');
    }
  }
  
  /**
   * 音声アラートを再生する
   * 要件: 4.1
   */
  playAlarm() {
    try {
      // Web Audio APIを使用して音声アラートを生成・再生
      this.playBeepSound();
    } catch (error) {
      console.warn('音声アラートの再生に失敗しました:', error);
      // フォールバック: HTML5 audioを試行
      this.playFallbackAlarm();
    }
  }
  
  /**
   * Web Audio APIを使用してビープ音を再生
   * 要件: 4.1
   */
  playBeepSound() {
    // Web Audio APIがサポートされているかチェック
    if (!window.AudioContext && !window.webkitAudioContext) {
      throw new Error('Web Audio API is not supported');
    }
    
    // AudioContextを作成（既存のものがあれば再利用）
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // AudioContextが停止状態の場合は再開
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // ビープ音のパラメータ
    const frequency = 800; // Hz
    const duration = 0.5; // 秒
    const volume = 0.3; // 音量 (0-1)
    
    // オシレーターを作成（音の波形を生成）
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    // オシレーターの設定
    oscillator.type = 'sine'; // サイン波
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    // 音量の設定とフェードアウト
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    // ノードを接続
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // 音声を再生
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
    
    // 複数回のビープ音を再生（アラート効果を高める）
    setTimeout(() => {
      if (this.currentState === this.TimerState.COMPLETED) {
        this.playBeepSound();
      }
    }, 600);
    
    setTimeout(() => {
      if (this.currentState === this.TimerState.COMPLETED) {
        this.playBeepSound();
      }
    }, 1200);
  }
  
  /**
   * フォールバック用のHTML5 audio音声アラート
   * 要件: 4.1
   */
  playFallbackAlarm() {
    try {
      // データURIを使用してビープ音を生成
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 0.5;
      const frequency = 800;
      const samples = sampleRate * duration;
      
      // 音声バッファを作成
      const buffer = audioContext.createBuffer(1, samples, sampleRate);
      const data = buffer.getChannelData(0);
      
      // サイン波を生成
      for (let i = 0; i < samples; i++) {
        data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
      }
      
      // 音声を再生
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
      
    } catch (error) {
      console.warn('フォールバック音声アラートも失敗しました:', error);
      // 最後の手段: ブラウザのデフォルト通知音（利用可能な場合）
      this.playSystemBeep();
    }
  }
  
  /**
   * システムビープ音の再生を試行
   * 要件: 4.1
   */
  playSystemBeep() {
    try {
      // 空のAudio要素を作成してエラーを発生させることで、
      // 一部のブラウザでシステム音を鳴らす
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
      audio.play().catch(() => {
        // 音声再生に失敗した場合は静かに処理
        console.info('音声アラートは再生できませんでしたが、視覚的通知は表示されています。');
      });
    } catch (error) {
      console.info('音声アラートは利用できませんが、視覚的通知は表示されています。');
    }
  }
  
  /**
   * すべてのタイマーとタイムアウトを適切にクリアする
   * interval/timeoutの適切なクリア処理を実装
   */
  clearAllTimers() {
    try {
      // メインのタイマーインターバルをクリア
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
        console.log('メインタイマーインターバルをクリアしました');
      }
      
      // 入力更新タイムアウトをクリア
      if (this.inputUpdateTimeout) {
        clearTimeout(this.inputUpdateTimeout);
        this.inputUpdateTimeout = null;
        console.log('入力更新タイムアウトをクリアしました');
      }
      
      // 念のため、グローバルに設定されている可能性のあるタイマーもチェック
      // （開発中のデバッグやテスト時に残る可能性があるため）
      if (window.timerAppInterval) {
        clearInterval(window.timerAppInterval);
        window.timerAppInterval = null;
      }
      
      if (window.timerAppTimeout) {
        clearTimeout(window.timerAppTimeout);
        window.timerAppTimeout = null;
      }
      
    } catch (error) {
      console.error('タイマークリア中にエラーが発生しました:', error);
    }
  }
  
  /**
   * エラーメッセージを表示する
   * @param {string} message - 表示するエラーメッセージ
   */
  showErrorMessage(message) {
    try {
      if (this.statusElement) {
        // 既存のメッセージをクリア
        this.statusElement.classList.remove('completion');
        this.statusElement.classList.add('error');
        this.statusElement.textContent = message;
        this.statusElement.setAttribute('aria-live', 'assertive');
        
        // 3秒後にエラーメッセージを自動的にクリア
        setTimeout(() => {
          if (this.statusElement && this.statusElement.classList.contains('error')) {
            this.statusElement.textContent = '';
            this.statusElement.classList.remove('error');
            this.statusElement.setAttribute('aria-live', 'polite');
          }
        }, 3000);
      }
      
      // コンソールにもエラーを出力
      console.error('TimerApp Error:', message);
      
    } catch (error) {
      console.error('エラーメッセージ表示中にエラーが発生しました:', error);
    }
  }
  
  /**
   * ブラウザタブの可視性変更を監視する設定
   * ブラウザタブ非アクティブ時の動作を考慮した実装
   */
  setupVisibilityChangeHandling() {
    try {
      // Page Visibility APIを使用してタブの可視性を監視
      if (typeof document.hidden !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          this.handleVisibilityChange();
        });
      }
      
      // フォーカス/ブラーイベントも監視（フォールバック）
      window.addEventListener('focus', () => {
        this.isTabActive = true;
        console.log('タブがアクティブになりました');
      });
      
      window.addEventListener('blur', () => {
        this.isTabActive = false;
        console.log('タブが非アクティブになりました');
      });
      
    } catch (error) {
      console.error('可視性変更監視の設定中にエラーが発生しました:', error);
    }
  }
  
  /**
   * タブの可視性変更時の処理
   */
  handleVisibilityChange() {
    try {
      if (document.hidden) {
        // タブが非アクティブになった
        this.isTabActive = false;
        console.log('タブが非表示になりました');
        
        // 非アクティブ時の最後の時刻を記録
        if (this.isRunning) {
          this.lastTickTime = Date.now();
        }
      } else {
        // タブがアクティブになった
        this.isTabActive = true;
        console.log('タブが表示されました');
        
        // アクティブになった時に時間の同期を行う
        if (this.isRunning && this.lastTickTime) {
          const currentTime = Date.now();
          const timeDiff = currentTime - this.lastTickTime;
          const missedTicks = Math.floor(timeDiff / this.config.tickInterval);
          
          if (missedTicks > 0) {
            console.log(`非アクティブ期間中に${missedTicks}秒経過しました`);
            // 抜けた時間分を一度に処理
            this.remainingSeconds -= missedTicks;
            
            if (this.remainingSeconds <= 0) {
              this.remainingSeconds = 0;
              this.complete();
            } else {
              this.updateDisplay();
            }
          }
          
          this.lastTickTime = currentTime;
        }
      }
    } catch (error) {
      console.error('可視性変更処理中にエラーが発生しました:', error);
    }
  }
  
  /**
   * ページ離脱時のクリーンアップを設定
   */
  setupPageUnloadHandling() {
    try {
      // ページ離脱時にすべてのタイマーをクリア
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
      
      // ページ非表示時にもクリーンアップ
      window.addEventListener('pagehide', () => {
        this.cleanup();
      });
      
      // ページ終了時のクリーンアップ
      window.addEventListener('unload', () => {
        this.cleanup();
      });
      
    } catch (error) {
      console.error('ページ離脱処理の設定中にエラーが発生しました:', error);
    }
  }
  
  /**
   * アプリケーションのクリーンアップ処理
   */
  cleanup() {
    try {
      console.log('TimerAppのクリーンアップを実行中...');
      
      // すべてのタイマーをクリア
      this.clearAllTimers();
      
      // AudioContextがあれば閉じる
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close().catch(error => {
          console.warn('AudioContext終了時にエラー:', error);
        });
      }
      
      // 状態をリセット
      this.isRunning = false;
      this.isPaused = false;
      this.currentState = this.TimerState.IDLE;
      this.lastTickTime = null;
      this.startAttempts = 0;
      
      console.log('TimerAppのクリーンアップが完了しました');
      
    } catch (error) {
      console.error('クリーンアップ中にエラーが発生しました:', error);
    }
  }
  
  /**
   * スクリーンリーダー用のアナウンスメント機能
   * 要件: 3.1, 3.3, 3.4 - スクリーンリーダー対応のための適切なラベル設定
   * @param {string} message - アナウンスするメッセージ
   * @param {string} priority - 'assertive' または 'polite'
   */
  announceToScreenReader(message, priority = 'polite') {
    try {
      const regionId = priority === 'assertive' ? 'ariaLiveRegion' : 'ariaPoliteRegion';
      const liveRegion = document.getElementById(regionId);
      
      if (liveRegion) {
        // 既存のメッセージをクリアしてから新しいメッセージを設定
        liveRegion.textContent = '';
        setTimeout(() => {
          liveRegion.textContent = message;
        }, 100);
        
        // 5秒後にメッセージをクリア
        setTimeout(() => {
          if (liveRegion.textContent === message) {
            liveRegion.textContent = '';
          }
        }, 5000);
      }
    } catch (error) {
      console.warn('スクリーンリーダーアナウンスメントでエラーが発生しました:', error);
    }
  }
  
  /**
   * タイマー状態変更時のスクリーンリーダーアナウンス
   * 要件: 3.1, 3.3, 3.4
   * @param {string} action - 実行されたアクション
   */
  announceTimerStateChange(action) {
    let message = '';
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    const timeText = `${minutes}分${seconds}秒`;
    
    switch (action) {
      case 'start':
        message = `タイマーを開始しました。残り時間: ${timeText}`;
        break;
      case 'pause':
        message = `タイマーを一時停止しました。残り時間: ${timeText}`;
        break;
      case 'resume':
        message = `タイマーを再開しました。残り時間: ${timeText}`;
        break;
      case 'reset':
        message = 'タイマーをリセットしました。';
        break;
      case 'complete':
        message = 'タイマーが完了しました！';
        break;
      default:
        message = `タイマー状態が変更されました。残り時間: ${timeText}`;
    }
    
    this.announceToScreenReader(message, 'assertive');
  }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
  window.timerApp = new TimerApp();
});