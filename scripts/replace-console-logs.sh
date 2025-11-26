#!/bin/bash

###############################################################################
# SCRIPT DE REMPLACEMENT AUTOMATIQUE DES CONSOLE.LOG PAR LOGGER
###############################################################################
#
# Ce script remplace tous les console.log/warn/error par le logger centralisé
#
# Usage: ./scripts/replace-console-logs.sh
#

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Remplacement console.log → logger${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Compter les occurrences avant
BEFORE_COUNT=$(grep -r "console\.\(log\|warn\|error\|info\)" src/ --exclude-dir=node_modules | wc -l)
echo -e "${YELLOW}Occurrences de console.* trouvées: $BEFORE_COUNT${NC}"
echo ""

# Créer un backup
echo -e "${YELLOW}Création d'un backup...${NC}"
BACKUP_DIR="backups/console-log-replacement-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r src/ "$BACKUP_DIR/"
echo -e "${GREEN}✓ Backup créé dans $BACKUP_DIR${NC}"
echo ""

# Fonction pour ajouter l'import du logger si nécessaire
add_logger_import() {
  local file=$1

  # Vérifier si le fichier importe déjà le logger
  if ! grep -q "import.*logger.*from.*@/core/utils/logger" "$file"; then
    # Trouver la dernière ligne d'import
    last_import=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)

    if [ -n "$last_import" ]; then
      # Insérer après la dernière ligne d'import
      sed -i "${last_import}a import { logger } from '@/core/utils/logger';" "$file"
    else
      # Pas d'import trouvé, ajouter au début du fichier
      sed -i "1i import { logger } from '@/core/utils/logger';" "$file"
    fi
  fi
}

# Parcourir tous les fichiers TypeScript/TSX
FILES_MODIFIED=0

find src/ -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  # Vérifier si le fichier contient console.*
  if grep -q "console\.\(log\|warn\|error\|info\)" "$file"; then
    echo -e "${YELLOW}Traitement de: $file${NC}"

    # Ajouter l'import du logger
    add_logger_import "$file"

    # Remplacer console.log par logger.debug (dev only)
    sed -i "s/console\.log(/logger.debug(/g" "$file"

    # Remplacer console.info par logger.info
    sed -i "s/console\.info(/logger.info(/g" "$file"

    # Remplacer console.warn par logger.warn
    sed -i "s/console\.warn(/logger.warn(/g" "$file"

    # Remplacer console.error par logger.error
    sed -i "s/console\.error(/logger.error(/g" "$file"

    FILES_MODIFIED=$((FILES_MODIFIED + 1))
  fi
done

# Compter après
AFTER_COUNT=$(grep -r "console\.\(log\|warn\|error\|info\)" src/ --exclude-dir=node_modules | wc -l)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}           RÉSULTATS${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Fichiers modifiés:${NC} $FILES_MODIFIED"
echo -e "${YELLOW}Occurrences avant:${NC} $BEFORE_COUNT"
echo -e "${YELLOW}Occurrences après:${NC} $AFTER_COUNT"
echo -e "${YELLOW}Occurrences remplacées:${NC} $((BEFORE_COUNT - AFTER_COUNT))"
echo ""

if [ $AFTER_COUNT -gt 0 ]; then
  echo -e "${RED}⚠ Il reste $AFTER_COUNT occurrences de console.* à traiter manuellement${NC}"
  echo -e "${YELLOW}Fichiers concernés:${NC}"
  grep -r "console\.\(log\|warn\|error\|info\)" src/ --exclude-dir=node_modules -l
else
  echo -e "${GREEN}✓ Tous les console.* ont été remplacés !${NC}"
fi

echo ""
echo -e "${YELLOW}Pour restaurer depuis le backup:${NC}"
echo -e "  rm -rf src/ && cp -r $BACKUP_DIR/src ."
echo ""
