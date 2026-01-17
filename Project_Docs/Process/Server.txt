[ 서버 방화벽(Firewall) 해결 과정 ]
작성일: 2026-01-17

1. 문제 상황
   - 서버에 프론트엔드(3000)와 백엔드(8080)를 모두 실행했으나, 외부(브라우저)에서 접속이 안 되고 무한 로딩 발생.
   - 원인은 "이중 방화벽" (서버 내부 OS 방화벽 + 오라클 클라우드 외부 방화벽) 때문임.

2. 해결 1단계: 서버 내부 방화벽 개방 (OS)
   - 서버 터미널에서 다음 명령어를 입력하여 포트 강제 개방.
   - 명령어:
     sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
     sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT
     sudo netfilter-persistent save

3. 해결 2단계: 오라클 클라우드 방화벽 개방 (Web Console)
   - 오라클 웹사이트에서 물리적인 보안 문을 열어줘야 함.
   
   [설정 경로]
   1) Oracle Cloud 로그인 -> Compute -> Instances -> 내 인스턴스 클릭
   2) 화면 중단 [Networking] 탭 클릭 -> [Primary VNIC]의 Subnet 링크 클릭
   3) [Security Lists] -> [Default Security List...] 클릭
   4) [Add Ingress Rules] 버튼 클릭

   [입력 값]
   - Source CIDR: 0.0.0.0/0 (전체 허용)
   - IP Protocol: TCP
   - Destination Port Range: 3000, 8080
   - [Add Ingress Rules] 버튼 클릭하여 저장.

4. 결과
   - http://168.107.52.201:3000 접속 성공.
