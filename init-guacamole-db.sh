#!/bin/bash
# Guacamole veritabanı şemasını oluştur

docker exec -i guacamole-postgres psql -U guacamole_user -d guacamole_db <<EOF
-- Veritabanı şemasını oluştur
\i /dev/stdin
EOF

docker exec guacamole /opt/guacamole/bin/initdb.sh --postgresql | docker exec -i guacamole-postgres psql -U guacamole_user -d guacamole_db

