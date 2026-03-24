import pandas as pd
import json

out = {}

df_p = pd.read_csv('models/phishing/data/phishingLabelDS.csv')
out['phishing_columns'] = list(df_p.columns)
out['phishing_sample'] = df_p.head(2).dropna(axis=1, how='all').to_dict('records')
if 'label' in df_p.columns:
    out['phishing_has_label'] = True
else:
    # See if there's any implicit label
    out['phishing_has_label'] = False

df_r = pd.read_csv('models/Ransomware/data/ramsomwaredataset.csv', engine='python', on_bad_lines='skip', nrows=5000)
target = 'Benign' if 'Benign' in df_r.columns else 'Class'
df_r = df_r.dropna(subset=[target])
df_r[target] = df_r[target].astype(int)
nums = df_r.select_dtypes(include='number')
corrs = nums.corr()[target].abs().sort_values(ascending=False).head(30)
out['ransomware_top_corrs'] = corrs.to_dict()

import glob
z_csvs = glob.glob('models/zero_day_attack/data/*.csv')
if z_csvs:
    df_z = pd.read_csv(z_csvs[0], nrows=0)
    out['zero_day_columns'] = list(df_z.columns)

with open('dataset_analysis.json', 'w') as f:
    json.dump(out, f, indent=2)
