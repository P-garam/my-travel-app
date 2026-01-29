#!/bin/bash
# GitHub 업로드 스크립트
# 사용법: 터미널에서 ./deploy-to-github.sh 실행

set -e
cd "$(dirname "$0")"

echo "1. Git 초기화..."
git init

echo "2. 모든 파일 스테이징..."
git add .

echo "3. 첫 커밋 생성..."
git commit -m "Deploy: final security check and snapshot feature"

echo "4. 원격 저장소 연결..."
git remote add origin https://github.com/P-garam/my-travel-app.git

echo "5. main 브랜치로 설정 및 푸시..."
git branch -M main
git push -u origin main

echo "✅ GitHub 업로드 완료!"
