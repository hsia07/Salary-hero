#!/usr/bin/env python3
"""Read-only structural validation for World 01 novel drafts; never asserts semantic correctness."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[2]
D=ROOT/"docs"/"novel"/"world01"
expected=[f"CH{i:02d}" for i in range(1,31)]+[f"EX{i:02d}" for i in range(1,4)]
found={}
for p in D.glob("*.md"):
 m=re.match(r"(CH\d{2}|EX\d{2})_",p.name)
 if m: found.setdefault(m.group(1),[]).append(p)
rows=[]
for key in expected:
 paths=found.get(key,[])
 text=paths[0].read_text(encoding="utf-8") if len(paths)==1 else ""
 n=len(re.sub(r"\s+","",text))
 rows.append({"chapter":key,"file":str(paths[0].relative_to(ROOT)) if paths else None,"chars_no_whitespace":n,"exists":len(paths)==1,"target_min_3000":n>=3000,"duplicate":len(paths)>1})
report={"expected":33,"drafts_present":sum(x["exists"] for x in rows),"chapters_meeting_3000_chars":sum(x["target_min_3000"] for x in rows),"structural_status":"PASS" if all(x["exists"] and x["target_min_3000"] for x in rows) else "INCOMPLETE","semantic_consistency":"NOT_AUTOMATICALLY_VERIFIED","rows":rows}
print(json.dumps(report,ensure_ascii=False,indent=2))
