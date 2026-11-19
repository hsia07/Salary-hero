"""角色專屬動作骨架（OpenPose COCO-18 標準繪製），給 ControlNet 作為逐格姿勢依據。
每個角色在 MOVES 裡定義自己的關鍵姿勢；不共用同一套動作（使用者 2026-11-19 裁決）。
用法：python tools/art/pose_skeletons.py <move_id> <out_dir>
座標：1024×1024 畫布，角色面向右方（朝敵人），Q 版 2.5 頭身比例，腳底約 y=950。
"""
import json, math, sys, pathlib
from PIL import Image, ImageDraw

# COCO-18：0鼻 1頸 2右肩 3右肘 4右腕 5左肩 6左肘 7左腕 8右髖 9右膝 10右踝 11左髖 12左膝 13左踝 14右眼 15左眼 16右耳 17左耳
LIMBS = [(1, 2), (1, 5), (2, 3), (3, 4), (5, 6), (6, 7), (1, 8), (8, 9), (9, 10), (1, 11), (11, 12), (12, 13), (1, 0), (0, 14), (14, 16), (0, 15), (15, 17)]
COLORS = [(255, 0, 0), (255, 85, 0), (255, 170, 0), (255, 255, 0), (170, 255, 0), (85, 255, 0), (0, 255, 0), (0, 255, 85), (0, 255, 170),
          (0, 255, 255), (0, 170, 255), (0, 85, 255), (0, 0, 255), (85, 0, 255), (170, 0, 255), (255, 0, 255), (255, 0, 170), (255, 0, 85)]


def body(neck=(470, 560), lean=0.0, crouch=0.0, head_tilt=0.0,
         pen=((590, 640), (665, 600)), case=((385, 650), (375, 725)),
         front=((545, 835), (560, 945)), back=((420, 835), (405, 945)), hip_dx=0):
    """以頸部為準組出全身關鍵點。pen＝畫面右側（持筆）手臂的肘、腕；case＝畫面左側（提包）手臂。"""
    nx, ny = neck
    hip_y = 720 + crouch
    hx = nx + hip_dx - lean * 0.6
    # 頭（Q 版大頭）：鼻在頸上方 120px，眼耳間距較寬
    t = math.radians(head_tilt)
    # Q 版大頭：鼻在頸上 150px，眼距與耳距約成人的 2 倍
    nose = (nx + 22 + 150 * math.sin(t), ny - 150 * math.cos(t))
    pts = {0: nose, 1: (nx, ny),
           # OpenPose 以角色本身左右命名：面向觀眾時角色的「左」在畫面右側
           15: (nose[0] + 40, nose[1] - 42), 14: (nose[0] - 32, nose[1] - 46), 17: (nose[0] + 58, nose[1] - 18), 16: (nose[0] - 110, nose[1] - 20),
           5: (nx + 62, ny + 18), 2: (nx - 62, ny + 18),
           6: pen[0], 7: pen[1], 3: case[0], 4: case[1],
           11: (hx + 38, hip_y), 8: (hx - 38, hip_y),
           12: front[0], 13: front[1], 9: back[0], 10: back[1]}
    return pts


# 白律｜審判筆突刺：蓄力（下蹲收筆）→ 舉筆後仰 → 跨步前傾 → 全身前衝直刺 → 慣性前送 → 收招
MOVES = {
 "bailu_pen_thrust": [
  ("ready",        body()),
  ("brace",        body(neck=(462, 585), crouch=22, head_tilt=-6, pen=((540, 650), (515, 600)), case=((390, 670), (380, 745)),
                        front=((560, 850), (565, 945)), back=((410, 850), (395, 945)))),
  ("windup",       body(neck=(445, 575), lean=-18, crouch=14, head_tilt=-10, pen=((520, 530), (470, 455)), case=((395, 665), (415, 735)),
                        front=((560, 835), (590, 925)), back=((410, 845), (390, 945)))),
  ("step",         body(neck=(505, 585), lean=26, crouch=24, head_tilt=8, pen=((555, 575), (600, 535)), case=((410, 665), (370, 720)),
                        front=((610, 835), (660, 945)), back=((440, 850), (380, 945)), hip_dx=-6)),
  ("impact",       body(neck=(555, 600), lean=48, crouch=36, head_tilt=14, pen=((700, 605), (815, 600)), case=((440, 660), (365, 680)),
                        front=((680, 835), (730, 945)), back=((470, 860), (360, 945)), hip_dx=-14)),
  ("followthrough",body(neck=(570, 615), lean=56, crouch=44, head_tilt=16, pen=((705, 630), (820, 645)), case=((450, 670), (380, 700)),
                        front=((690, 845), (735, 945)), back=((480, 865), (370, 945)), hip_dx=-16)),
  ("recover",      body(neck=(500, 575), lean=12, crouch=10, head_tilt=4, pen=((600, 610), (650, 570)), case=((400, 660), (385, 735)),
                        front=((585, 840), (610, 945)), back=((430, 845), (400, 945)))),
 ],
}


def draw(pts, size=1024):
    im = Image.new("RGB", (size, size), (0, 0, 0)); d = ImageDraw.Draw(im)
    for i, (a, b) in enumerate(LIMBS):
        if a in pts and b in pts:
            (x1, y1), (x2, y2) = pts[a], pts[b]
            # 標準 OpenPose：橢圓肢段（寬 8px）
            L = math.hypot(x2 - x1, y2 - y1); ang = math.atan2(y2 - y1, x2 - x1)
            poly = []
            for k in range(0, 360, 20):
                r = math.radians(k); ex, ey = L / 2 * math.cos(r), 6 * math.sin(r)
                poly.append(((x1 + x2) / 2 + ex * math.cos(ang) - ey * math.sin(ang), (y1 + y2) / 2 + ex * math.sin(ang) + ey * math.cos(ang)))
            d.polygon(poly, fill=tuple(int(c * .6) for c in COLORS[i]))
    for k, (x, y) in pts.items():
        d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=COLORS[k])
    return im


if __name__ == "__main__":
    move, out = sys.argv[1], pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    sheet = Image.new("RGB", (256 * len(MOVES[move]), 256))
    for i, (name, pts) in enumerate(MOVES[move]):
        im = draw(pts); im.save(out / f"{move}_{i}_{name}.png"); sheet.paste(im.resize((256, 256)), (i * 256, 0))
    sheet.save(out / f"{move}_preview.png")
    print("ok", len(MOVES[move]))
