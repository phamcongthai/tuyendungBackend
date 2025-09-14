# Hướng dẫn tích hợp Notification System

## Tổng quan

Hệ thống notification đã được implement với 2 trường hợp:

**Th1**: Recruiter online → tạo room → client ứng tuyển join room → gửi notification realtime
**Th2**: Recruiter offline → lưu notification vào DB → khi đăng nhập hiển thị số thông báo chưa đọc

## API Endpoints

### 1. Recruiter Notifications

#### Lấy số notification chưa đọc
```
GET /recruiters/notifications/unread-count
Authorization: Bearer <token>
Response: { unreadCount: 5 }
```

#### Lấy danh sách notification chưa đọc
```
GET /recruiters/notifications/unread
Authorization: Bearer <token>
Response: [notification objects]
```

#### Lấy tất cả notification (tự động đánh dấu đã đọc)
```
GET /recruiters/notifications
Authorization: Bearer <token>
Response: [notification objects]
Note: Khi gọi API này, tất cả notification chưa đọc sẽ tự động được đánh dấu là đã đọc
```

#### Đánh dấu notification là đã đọc
```
PATCH /recruiters/notifications/mark-read/:id
Authorization: Bearer <token>
Response: { updated notification }
```

### 2. Socket.IO Events

#### Kết nối Socket.IO
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/notifications', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

#### Recruiter join room (online)
```javascript
// Khi recruiter đăng nhập
socket.emit('recruiterJoin', { recruiterId: 'recruiter-id' });

// Lắng nghe response
socket.on('recruiterJoined', (data) => {
  console.log('Recruiter joined:', data);
  // data = { recruiterId, online: true }
});
```

#### Lắng nghe notification mới
```javascript
socket.on('newNotification', (notification) => {
  console.log('New notification:', notification);
  // Hiển thị notification trong UI
  showNotification(notification);
});
```

#### Lắng nghe số notification chưa đọc
```javascript
socket.on('unreadCount', (data) => {
  console.log('Unread count:', data.unreadCount);
  // Cập nhật badge đỏ
  updateNotificationBadge(data.unreadCount);
});
```

## Frontend Integration

### 1. Recruiter App

#### Khi recruiter đăng nhập
```javascript
// 1. Kết nối Socket.IO
const socket = io('http://localhost:3000/notifications', {
  auth: { token: recruiterToken }
});

// 2. Join room
socket.emit('recruiterJoin', { recruiterId: recruiterId });

// 3. Lắng nghe events
socket.on('newNotification', handleNewNotification);
socket.on('unreadCount', handleUnreadCount);

// 4. Lấy số notification chưa đọc
const response = await fetch('/api/recruiters/notifications/unread-count', {
  headers: { Authorization: `Bearer ${recruiterToken}` }
});
const { unreadCount } = await response.json();
updateNotificationBadge(unreadCount);
```

#### Hiển thị notification badge
```javascript
function updateNotificationBadge(count) {
  const badge = document.getElementById('notification-badge');
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'block';
    badge.style.backgroundColor = 'red';
    badge.style.color = 'white';
  } else {
    badge.style.display = 'none';
  }
}
```

#### Hiển thị notification dropdown (tự động đánh dấu đã đọc)
```javascript
async function loadNotifications() {
  // Gọi API này sẽ tự động đánh dấu tất cả notification là đã đọc
  const response = await fetch('/api/recruiters/notifications', {
    headers: { Authorization: `Bearer ${recruiterToken}` }
  });
  const notifications = await response.json();
  
  // Render notifications trong dropdown
  renderNotifications(notifications);
  
  // Badge sẽ tự động được cập nhật về 0 qua Socket.IO
}

function renderNotifications(notifications) {
  const container = document.getElementById('notification-dropdown');
  container.innerHTML = notifications.map(notif => `
    <div class="notification-item read">
      <div class="message">${notif.message}</div>
      <div class="time">${new Date(notif.createdAt).toLocaleString()}</div>
      <!-- Không cần button đánh dấu đã đọc vì đã tự động đánh dấu -->
    </div>
  `).join('');
}
```

#### Đánh dấu notification là đã đọc
```javascript
async function markAsRead(notificationId) {
  await fetch(`/api/recruiters/notifications/mark-read/${notificationId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${recruiterToken}` }
  });
  
  // Reload notifications
  loadNotifications();
}
```

### 2. Client App (Ứng viên)

#### Khi ứng viên ứng tuyển
```javascript
async function submitApplication(jobId, coverLetter) {
  const response = await fetch('/api/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`
    },
    body: JSON.stringify({ jobId, coverLetter })
  });
  
  if (response.ok) {
    // Application đã được tạo và notification đã được gửi
    alert('Ứng tuyển thành công!');
  }
}
```

## Database Schema

### Notification Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // recruiterId
  message: String,
  type: String, // 'application_submitted', 'application_accepted', etc.
  isRead: Boolean,
  readAt: Date,
  deleted: Boolean,
  applicationId: ObjectId, // ID của đơn ứng tuyển
  jobId: ObjectId, // ID của job
  applicantId: ObjectId, // ID của người ứng tuyển
  metadata: Object, // { jobTitle, applicantName, applicationId }
  createdAt: Date,
  updatedAt: Date
}
```

## Flow hoạt động

### Th1: Recruiter Online
1. Recruiter đăng nhập → Socket.IO join room
2. Client ứng tuyển → POST /applications
3. Application được lưu vào DB
4. Notification được tạo và lưu vào DB
5. Socket.IO emit 'newNotification' đến recruiter room
6. Recruiter nhận notification realtime
7. Badge đỏ hiển thị số notification chưa đọc

### Th2: Recruiter Offline
1. Client ứng tuyển → POST /applications
2. Application được lưu vào DB
3. Notification được tạo và lưu vào DB
4. Không có Socket.IO emit (recruiter offline)
5. Khi recruiter đăng nhập lại:
   - Socket.IO join room
   - Gọi API lấy số notification chưa đọc
   - Hiển thị badge đỏ với số notification chưa đọc

## Testing

### Test API
```bash
# Lấy số notification chưa đọc
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/recruiters/notifications/unread-count

# Test gửi notification
curl -X POST http://localhost:3000/notifications/test-send \
  -H "Content-Type: application/json" \
  -d '{"userId": "recruiter-id", "message": "Test notification", "type": "other"}'
```

### Test Socket.IO
```javascript
// Test kết nối
const socket = io('http://localhost:3000/notifications');
socket.on('connect', () => console.log('Connected'));

// Test join room
socket.emit('recruiterJoin', { recruiterId: 'test-recruiter-id' });
```

## Lưu ý

1. **RecruiterId**: Phải đảm bảo recruiterId được convert đúng từ ObjectId sang string
2. **Token Authentication**: Socket.IO cần JWT token để xác thực
3. **Error Handling**: Luôn xử lý lỗi khi gọi API hoặc Socket.IO
4. **Performance**: Chỉ load notification khi cần thiết, không load tất cả
5. **Real-time**: Socket.IO chỉ hoạt động khi recruiter online, offline thì dùng API
