# Hướng dẫn setup Cloudinary

## Bước 1: Tạo tài khoản Cloudinary
1. Truy cập https://cloudinary.com/
2. Đăng ký tài khoản miễn phí
3. Xác nhận email

## Bước 2: Lấy thông tin API
1. Đăng nhập vào Cloudinary Dashboard
2. Vào phần "Dashboard" 
3. Copy các thông tin sau:
   - Cloud Name
   - API Key
   - API Secret

## Bước 3: Cấu hình Environment Variables
Tạo file `.env` trong thư mục `job-recruitment-app` và thêm:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Bước 4: Khởi động ứng dụng
```bash
cd job-recruitment-app
npm install
npm run start:dev
```

## Lưu ý:
- Ảnh sẽ được upload lên Cloudinary và lưu trong folder "recruiters"
- Ảnh sẽ được resize về kích thước 300px width
- File local sẽ được xóa sau khi upload thành công
- Dung lượng file tối đa: 5MB
- Định dạng hỗ trợ: JPG, PNG, GIF 