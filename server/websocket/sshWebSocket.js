const WebSocket = require('ws');
const { Client } = require('ssh2');
const ConnectionToken = require('../models/ConnectionToken');
const Server = require('../models/Server');

let wss = null;

const initializeWebSocket = (httpServer) => {
  wss = new WebSocket.Server({ 
    server: httpServer,
    path: '/ws/ssh'
  });

  wss.on('connection', (ws, req) => {
    console.log('Yeni WebSocket bağlantısı');

    let sshClient = null;
    let sshStream = null;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'connect') {
          const { token } = data;

          // Token'ı doğrula
          const connectionToken = await ConnectionToken.findOne({ token })
            .populate('serverId');

          if (!connectionToken || connectionToken.expiresAt < new Date()) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Geçersiz veya süresi dolmuş token',
            }));
            return;
          }

          // Sunucu bilgilerini getir
          const server = await Server.findById(connectionToken.serverId)
            .select('+sshPassword +sshKey');

          if (!server || server.type !== 'VPS') {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Bu sunucu SSH bağlantısı için uygun değil',
            }));
            return;
          }

          // SSH bağlantısı kur
          sshClient = new Client();

          const sshConfig = {
            host: server.ipAddress,
            port: server.sshPort || 22,
            username: server.sshUsername || 'root',
          };

          if (server.sshKey) {
            sshConfig.privateKey = server.sshKey;
          } else if (server.sshPassword) {
            sshConfig.password = server.decrypt(server.sshPassword);
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'SSH kimlik bilgileri bulunamadı',
            }));
            return;
          }

          sshClient.on('ready', () => {
            console.log('SSH bağlantısı başarılı');
            ws.send(JSON.stringify({
              type: 'connected',
              message: 'SSH bağlantısı kuruldu',
            }));

            sshClient.shell((err, stream) => {
              if (err) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Shell oluşturulamadı: ' + err.message,
                }));
                return;
              }

              sshStream = stream;

              // Terminal çıktısını WebSocket'e gönder
              stream.on('data', (data) => {
                ws.send(JSON.stringify({
                  type: 'output',
                  data: data.toString(),
                }));
              });

              stream.on('close', () => {
                ws.send(JSON.stringify({
                  type: 'closed',
                  message: 'SSH bağlantısı kapandı',
                }));
              });

              stream.stderr.on('data', (data) => {
                ws.send(JSON.stringify({
                  type: 'error',
                  data: data.toString(),
                }));
              });
            });
          });

          sshClient.on('error', (err) => {
            console.error('SSH hatası:', err);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'SSH bağlantı hatası: ' + err.message,
            }));
          });

          sshClient.connect(sshConfig);
        } else if (data.type === 'input' && sshStream) {
          // Kullanıcı girdisini SSH'a gönder
          sshStream.write(data.data);
        }
      } catch (error) {
        console.error('WebSocket hatası:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'İşlem hatası: ' + error.message,
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket bağlantısı kapandı');
      if (sshStream) {
        sshStream.end();
      }
      if (sshClient) {
        sshClient.end();
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('WebSocket server başlatıldı: /ws/ssh');
};

module.exports = { initializeWebSocket };

