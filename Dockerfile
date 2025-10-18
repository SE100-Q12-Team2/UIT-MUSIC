# -------- Stage 1: fetch ffmpeg/ffprobe (Alpine) ----------
FROM alpine:3.20 AS ffmpegbuilder
RUN apk add --no-cache curl xz tar
WORKDIR /tmp/ffmpeg
# Static build cho Linux x86_64 (amd64)
RUN curl -L -o ffmpeg.tar.xz \
      https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz \
 && tar -xJf ffmpeg.tar.xz \
 && cp ffmpeg-*-amd64-static/ffmpeg /ffmpeg \
 && cp ffmpeg-*-amd64-static/ffprobe /ffprobe

# -------- Stage 2: Lambda runtime (Node.js 22) ------------
FROM public.ecr.aws/lambda/nodejs:22-x86_64

# Đặt binary vào đúng chỗ /opt/bin và cấp quyền thực thi
COPY --from=ffmpegbuilder /ffmpeg /opt/bin/ffmpeg
COPY --from=ffmpegbuilder /ffprobe /opt/bin/ffprobe
RUN chmod +x /opt/bin/ffmpeg /opt/bin/ffprobe \
 && /opt/bin/ffmpeg -version \
 && /opt/bin/ffprobe -version

# App deps
WORKDIR /var/task
COPY package*.json ./
RUN npm ci --omit=dev

# Source
COPY . .

# Cho PATH thấy /opt/bin để có thể gọi "ffmpeg" trực tiếp
ENV PATH="/opt/bin:${PATH}"

# Handler (điều chỉnh nếu file/func khác)
CMD ["index.handler"]
