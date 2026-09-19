# Thước ngắm thật trong GLB — 16/09/2026

## Kết quả

Asset mới: `public/models/ak47_adjustable.glb`. File gốc `public/models/akm.glb` giữ nguyên (SHA-256 `b0b2b4e9d612079ee2b2ad955f353abace441b8fb7cea448e098e78e35405552`). Chỉ trường bắn chuyển sang asset mới; các phân hệ khác không đổi model.

Model thuộc trường hợp C: thước ngắm gộp trong một primitive của `AKM_body_M_AKM_body_0`. Nguồn có 9 node, 3 mesh/3 primitive, 3 material, 9 ảnh texture, không có animation. Geometry body có 62 cụm khi đối chiếu các đỉnh trùng vị trí. Cụm 4/5/6/7 được xác nhận qua bounding box và render: lá thước ngắm, khe ngắm sau, hai chi tiết hai bên. Tổng 556 tam giác; bệ phía dưới giữ nguyên trên thân.

Blender CLI đã thực sự chạy và tách 556 tam giác này thành object. Exporter Blender thay đổi normals, nên bước đóng gói sau export đối chiếu geometry Blender rồi tái sử dụng nguyên buffer thuộc tính/texture gốc. Không có primitive giả được dựng để thay thước ngắm.

Hierarchy mới: `AKM_body → RearSight → RearSightGeometry`; mesh body còn 10.790 tam giác. RearSight có pivot tại đầu trước của geometry đã đối chiếu và metadata `role: rear-sight-visual`. Offset ngược trên child giữ nguyên vị trí mọi đỉnh ở preset A.

## Tái tạo và kiểm chứng

Chạy từ thư mục project:

```powershell
node scripts/inspect-ak-sight.mjs
& 'D:\Blender\blender.exe' -b -P scripts/blender/prepare_adjustable_ak_sight.py
node scripts/inspect-ak-sight.mjs public/models/ak47_adjustable.glb
node scripts/verify-ak-sight.mjs
node --import tsx --test scripts/tests/rear-sight.test.ts scripts/tests/arcade-range.test.ts
```

Script Blender tự gọi `finalize-ak-sight.mjs`. Nếu fingerprint nguồn thay đổi hoặc không khớp đủ 556 tam giác, script dừng. Không chạy finalize độc lập lên asset cuối vì đầu vào của bước này phải là export Blender.

Các báo cáo và ảnh đối chiếu nằm trong `artifacts/ak-sight/`. `source-inspection.json` và `output-inspection.json` chứa hierarchy, matrix local/world, primitive, material/attribute slots, geometry islands, bounds, animation và images.

Verifier xác nhận:

- Tổng 19.604 tam giác không thay đổi; đủ tất cả tam giác gốc, không thêm/mất mặt.
- Sai khác vị trí, normals và cả 3 bộ UV: **0**.
- 9 texture giữ nguyên bytes; material gắn đúng từng mặt.
- Asset cuối 8.550.016 bytes, tăng 136.724 bytes; thêm một primitive/draw call so với nguồn. Attribute buffers được chia sẻ, không tạo texture mới.
- Bản trong `dist/models` có SHA-256 giống asset nguồn mới.

## Tích hợp

Giữ UI A/B/C/D và preview hiện tại. `rearSightTransform.ts` tìm đúng node kèm metadata, lưu local position/quaternion/scale một lần cho mỗi clone. Preset dùng transform gốc cộng offset, nội suy ngắn rồi chốt chính xác. Reset về A trả đúng transform GLB; cleanup cũng phục hồi. Chỉ có thay đổi hình học trực quan, không gắn preset vào cự ly hay logic đạn/điểm. Không reload GLB khi đổi preset. Asset không hỗ trợ thì các nút preset/reset bị disable.

Giữ nguyên camera mặc định, input, fullscreen, gameplay, HUD và cấu hình người dùng đang có. Không thêm panel X/Y/Z mới.

## Kiểm thử thực hiện

- `npm run lint`: đạt; `npm run build`: đạt.
- 7 test rear sight/arcade: đạt; kiểm tra nhiều vòng A/B/C/D không trôi transform, không đổi sibling, không detach parent, scale giữ nguyên, node không hỗ trợ bị từ chối.
- Browser fixture `scripts/range-input-smoke.html`: 17/17 đạt; Pointer Lock trong fixture là giả lập. Assertion giới hạn alignment được cập nhật theo constant hiện tại của project, không đổi thiết lập người dùng.
- Website thật: model load, mở panel, chọn A/B/C/D, quan sát khe ngắm chuyển, reset trở về A; ADS/hip-fire; vào/thoát fullscreen; đóng panel rồi bắn tăng đúng 1 viên/1 dòng điểm. Console không có lỗi, còn cảnh báo Three.Clock có sẵn.
- Trình duyệt tích hợp từ chối Pointer Lock thật; chưa xác nhận tổ hợp chuột vật lý trong desktop browser hoặc multi-touch trên điện thoại. Input production không bị sửa trong patch asset này.
- Cảnh báo build có sẵn: vị trí CSS @import, mixed import Gamification, bundle chính lớn.
