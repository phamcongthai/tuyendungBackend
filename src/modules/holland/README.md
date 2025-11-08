# Holland Test (RIASEC) Module

## 📋 Tổng quan

Module trắc nghiệm tính cách Holland (RIASEC) giúp ứng viên khám phá tính cách nghề nghiệp của mình.

## 🎯 Quy tắc tính điểm (ĐÃ FIX CỨNG)

Hệ thống sử dụng thang điểm 5 mức:

- **Rất không thích** = 0 điểm
- **Không thích** = 1 điểm  
- **Bình thường** = 2 điểm
- **Thích** = 3 điểm
- **Rất thích** = 4 điểm

## 🔤 Nhóm RIASEC

### R - Realistic (Thực tế)
- Thích làm việc với máy móc, công cụ, thủ công
- Ví dụ nghề: Kỹ sư, Thợ cơ khí, Kiến trúc sư

### I - Investigative (Nghiên cứu)
- Thích tư duy, phân tích, giải quyết vấn đề
- Ví dụ nghề: Nhà khoa học, Lập trình viên, Nhà nghiên cứu

### A - Artistic (Nghệ thuật)
- Thích sáng tạo, thẩm mỹ, nghệ thuật
- Ví dụ nghề: Designer, Nhạc sĩ, Nhà văn

### S - Social (Xã hội)
- Thích giúp đỡ, dạy dỗ, chăm sóc người khác
- Ví dụ nghề: Giáo viên, Y tá, Tư vấn viên

### E - Enterprising (Kinh doanh)
- Thích lãnh đạo, thuyết phục, bán hàng
- Ví dụ nghề: Manager, Sales, Doanh nhân

### C - Conventional (Truyền thống)
- Thích tổ chức, quản lý dữ liệu, làm theo quy trình
- Ví dụ nghề: Kế toán, Thư ký, Quản trị văn phòng

## 📊 Cách tính kết quả

1. **Tính tổng điểm** cho từng nhóm (R, I, A, S, E, C)
2. **Sắp xếp** 6 nhóm theo điểm giảm dần
3. **Lấy top 3** nhóm cao nhất → Tạo mã Holland (VD: "A-S-E")
4. **Tìm profile** tương ứng với mã Holland
5. **Lưu kết quả** vào `holland_results` và `users.hollandScore/hollandType`

## 🎓 Hướng dẫn Admin

### 1. Tạo câu hỏi

**Khuyến nghị:** 8 câu hỏi cho mỗi nhóm (tổng 48 câu)

**Các bước:**
1. Vào **Admin → Trắc nghiệm Holland → Câu hỏi**
2. Click **"Thêm câu hỏi"**
3. Nhập:
   - **Số thứ tự**: 1, 2, 3... (thứ tự hiển thị)
   - **Nội dung**: Câu hỏi bắt đầu bằng "Bạn thích..."
   - **Nhóm RIASEC**: Chọn R, I, A, S, E hoặc C
4. Click **"Lưu"**

**Lưu ý:** Thang điểm đã được fix cứng, không cần nhập options!

### 2. Tạo Profiles

**Các bước:**
1. Vào **Admin → Trắc nghiệm Holland → Profiles**
2. Click **"Thêm Profile"**
3. Nhập:
   - **Mã**: VD "A-S-E", "R-I-C"
   - **Tiêu đề**: Mô tả ngắn gọn
   - **Mô tả**: Giải thích chi tiết về nhóm tính cách
   - **Nghề nghiệp phù hợp**: Mỗi dòng 1 nghề
   - **Kỹ năng gợi ý**: Mỗi dòng 1 kỹ năng
4. Click **"Lưu"**

### 3. Xem kết quả

Vào **Admin → Trắc nghiệm Holland → Kết quả** để xem:
- Danh sách users đã làm test
- Điểm số từng nhóm
- Mã Holland
- Thời gian làm test

## 🧪 Import dữ liệu mẫu

File mẫu đã được tạo sẵn:
- `seed-data/sample-questions.json` - 18 câu hỏi mẫu
- `seed-data/sample-profiles.json` - 4 profiles mẫu

Bạn có thể import trực tiếp vào MongoDB hoặc tạo qua Admin UI.

## 🔗 API Endpoints

### Admin
- `GET /admin/holland/questions` - Lấy danh sách câu hỏi
- `POST /admin/holland/questions` - Tạo câu hỏi mới
- `PUT /admin/holland/questions/:id` - Cập nhật câu hỏi
- `DELETE /admin/holland/questions/:id` - Xóa câu hỏi
- `GET /admin/holland/profiles` - Lấy danh sách profiles
- `POST /admin/holland/profiles` - Tạo profile mới
- `PUT /admin/holland/profiles/:id` - Cập nhật profile
- `DELETE /admin/holland/profiles/:id` - Xóa profile
- `GET /admin/holland/results` - Xem kết quả users

### Client
- `GET /holland/questions` - Lấy câu hỏi (public)
- `POST /holland/submit` - Submit bài test (cần login)
- `GET /holland/my-result` - Xem kết quả của mình

## 💡 Tips

1. **Câu hỏi nên rõ ràng, dễ hiểu**
2. **Mỗi nhóm nên có số câu hỏi tương đương** (8 câu/nhóm)
3. **Profile code phải khớp với top 3 nhóm** (VD: A-S-E, R-I-C)
4. **Nghề nghiệp gợi ý nên cụ thể và phổ biến**
5. **Kỹ năng nên liên quan trực tiếp đến nhóm tính cách**
