# app.py - Flask API サーバー
from flask import Flask, request, jsonify
import pickle
import numpy as np
from flask_cors import CORS
import math
from scipy import signal

app = Flask(__name__)
CORS(app)  # CORS対応

# モデルのロード
try:
    model_arousal = pickle.load(open('/Users/akishino_riku/Dataset/WESAD/model 02:24:2025/model_arousal.pkl', 'rb'))
    model_valence = pickle.load(open('/Users/akishino_riku/Dataset/WESAD/model 02:24:2025/model_valence.pkl', 'rb'))
    print("モデルの読み込みに成功しました。")
except Exception as e:
    print(f"モデルの読み込みエラー: {e}")
    # デモ用のダミーモデルを使用
    from sklearn.dummy import DummyRegressor
    model_arousal = DummyRegressor(strategy="constant", constant=0.2)
    model_arousal.fit([[0] * 9], [0])  # 9特徴量を想定
    model_valence = DummyRegressor(strategy="constant", constant=0.3)
    model_valence.fit([[0] * 9], [0])  # 9特徴量を想定
    print("ダミーモデルを使用します。")

# HR/EDAから特徴量を計算する関数
def calculate_features(hr, eda):
    """
    心拍数(HR)と皮膚電気活動(EDA)から特徴量を計算
    
    必要な特徴量:
    - BVP_LF（低周波成分）
    - BVP_HF（高周波成分）
    - BVP_RMSSD（心拍変動の標準偏差）
    - BVP_Peak_Count（ピーク数）
    - BVP_Slope（傾き）
    - BVP_Rolling_Mean（移動平均）
    - BVP_HF_LF_Ratio（高周波/低周波比）
    - EDA_Slope（発汗の変化率）
    - EDA_Peak_Count（発汗ピーク数）
    """
    # モデルが必要とする実際の特徴量を計算するにはより詳細なデータ系列が必要
    # ここでは、単一のHRとEDA値からシミュレートした特徴量を生成
    
    # BVP (心拍) 関連の特徴量をHRから推定
    # 正常範囲内で若干のランダム性を持たせる
    
    # 心拍数に基づいて低周波成分を推定 (60-100bpmの範囲で0.1-0.5の値)
    bvp_lf = 0.1 + (hr - 60) / 80.0 * 0.4
    
    # 心拍数に基づいて高周波成分を推定 (リラックス状態で高い)
    bvp_hf = 0.5 - (hr - 60) / 80.0 * 0.3
    
    # 心拍変動の標準偏差 (RMSSD) - 低心拍数ほど高い傾向
    bvp_rmssd = 50 - (hr - 60) / 40.0 * 30
    
    # ピーク数 - 簡易的に心拍数そのものと相関
    bvp_peak_count = hr / 60.0 * 10  # 10秒間あたりのピーク数と仮定
    
    # 傾き - ランダムな値（実際は時系列データから計算）
    bvp_slope = (np.random.random() - 0.5) * 0.2
    
    # 移動平均 - 心拍数そのものに近い
    bvp_rolling_mean = hr + (np.random.random() - 0.5) * 5
    
    # 高周波/低周波比 - リラックス状態で高い
    bvp_hf_lf_ratio = bvp_hf / max(0.1, bvp_lf)
    
    # EDA関連特徴量
    # 発汗の変化率 - ランダムな値（実際は時系列データから計算）
    eda_slope = (np.random.random() - 0.5) * 0.1
    
    # 発汗ピーク数 - 高EDほどピーク数も多い傾向
    eda_peak_count = max(0, eda - 2) * 0.5 + np.random.random() * 2
    
    # 特徴量を配列にまとめる
    features = np.array([
        bvp_lf, bvp_hf, bvp_rmssd, bvp_peak_count, bvp_slope, 
        bvp_rolling_mean, bvp_hf_lf_ratio, eda_slope, eda_peak_count
    ])
    
    # 特徴量の名前（デバッグとログ用）
    feature_names = [
        "BVP_LF", "BVP_HF", "BVP_RMSSD", "BVP_Peak_Count", "BVP_Slope",
        "BVP_Rolling_Mean", "BVP_HF_LF_Ratio", "EDA_Slope", "EDA_Peak_Count"
    ]
    
    # 計算した特徴量をログに出力
    for name, value in zip(feature_names, features):
        print(f"  {name}: {value:.4f}")
    
    return features

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    hr = data.get('heartRate')
    eda = data.get('eda')
    
    print(f"入力値: HR={hr}, EDA={eda}")
    
    # 特徴量を計算
    print("特徴量の計算:")
    features = calculate_features(hr, eda)
    
    # 特徴量を2D配列に変換（モデル入力用）
    features_2d = features.reshape(1, -1)
    
    # 予測
    try:
        # スケーリング: 1-9スケールから-1〜1スケールへ変換
        arousal_raw = float(model_arousal.predict(features_2d)[0])
        valence_raw = float(model_valence.predict(features_2d)[0])
        
        # モデル出力が1-9スケールの場合、-1〜1スケールに変換
        arousal = (arousal_raw - 5) / 4  # 5を中心とし、±4で正規化
        valence = (valence_raw - 5) / 4
        
        # 値の範囲を-1〜1に制限
        arousal = max(-1.0, min(1.0, arousal))
        valence = max(-1.0, min(1.0, valence))
        
        print(f"予測結果: arousal={arousal:.4f} (raw={arousal_raw:.4f}), valence={valence:.4f} (raw={valence_raw:.4f})")
        
        return jsonify({
            'arousal': arousal,
            'valence': valence,
            'rawArousal': arousal_raw,
            'rawValence': valence_raw,
            'features': {
                'bvp_lf': float(features[0]),
                'bvp_hf': float(features[1]),
                'bvp_rmssd': float(features[2]),
                'bvp_peak_count': float(features[3]),
                'bvp_slope': float(features[4]),
                'bvp_rolling_mean': float(features[5]),
                'bvp_hf_lf_ratio': float(features[6]),
                'eda_slope': float(features[7]),
                'eda_peak_count': float(features[8])
            }
        })
    except Exception as e:
        print(f"予測エラー: {e}")
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    print("APIサーバーを起動します...")
    app.run(debug=True, host='0.0.0.0', port=8000)  # ポート5000から8000に変更