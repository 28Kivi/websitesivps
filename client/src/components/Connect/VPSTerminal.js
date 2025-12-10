import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { logger } from '../../utils/logger';
import 'xterm/css/xterm.css';
import './VPSTerminal.css';

const VPSTerminal = ({ server, token }) => {
  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    // Terminal oluştur
    terminal.current = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#aeafad',
        selection: '#264f78',
      },
    });

    fitAddon.current = new FitAddon();
    terminal.current.loadAddon(fitAddon.current);
    terminal.current.loadAddon(new WebLinksAddon());

    terminal.current.open(terminalRef.current);
    fitAddon.current.fit();

    // WebSocket bağlantısı
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/ssh`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      logger.log('WebSocket connection established');
      // SSH bağlantısını başlat
      ws.send(JSON.stringify({
        type: 'connect',
        token: token,
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'connected') {
        terminal.current.writeln('\r\n\x1b[32m✓ SSH bağlantısı kuruldu\x1b[0m\r\n');
      } else if (data.type === 'output') {
        terminal.current.write(data.data);
      } else if (data.type === 'error') {
        terminal.current.writeln(`\r\n\x1b[31mHata: ${data.message || data.data}\x1b[0m\r\n`);
      } else if (data.type === 'closed') {
        terminal.current.writeln('\r\n\x1b[33mSSH bağlantısı kapandı\x1b[0m\r\n');
      }
    };

    ws.onerror = (error) => {
      logger.error('WebSocket error:', error);
      terminal.current.writeln('\r\n\x1b[31mWebSocket bağlantı hatası\x1b[0m\r\n');
    };

    ws.onclose = () => {
      terminal.current.writeln('\r\n\x1b[33mWebSocket bağlantısı kapandı\x1b[0m\r\n');
    };

    wsRef.current = ws;

    // Terminal girdisini WebSocket'e gönder
    terminal.current.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'input',
          data: data,
        }));
      }
    });

    // Pencere boyutu değiştiğinde terminali yeniden boyutlandır
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (terminal.current) {
        terminal.current.dispose();
      }
    };
  }, [token]);

  return (
    <div className="vps-terminal-container">
      <div ref={terminalRef} className="terminal-wrapper"></div>
    </div>
  );
};

export default VPSTerminal;

