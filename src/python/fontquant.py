import warnings

# ignore warnings https://stackoverflow.com/a/74544084
# see https://github.com/robotools/fontParts/issues/753
warnings.filterwarnings("ignore")

import json

from fontquant import quantify

results = quantify("/home/pyodide/fontquant/fonts/font.ttf")

json.dumps(results)
