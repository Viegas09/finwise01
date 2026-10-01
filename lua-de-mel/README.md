# Lua de mel em Paris

App da viagem de 19 a 29 de outubro: roteiro com rotas e mapas, lista de desejos, reservas com ingressos, checklist, gastos e guia rápido. Funciona instalado no celular e sem internet.

Endereço: https://viegas09.github.io/finwise01/lua-de-mel/

## Sincronização entre os dois celulares

Sem configurar nada, cada celular guarda os próprios dados. Para que o roteiro, as anotações, o checklist, as reservas, os gastos e os anexos fiquem iguais nos dois celulares, o app usa o Firestore, o banco de dados gratuito do Firebase (Google). Basta configurar uma vez, em um dos celulares ou no computador.

### 1. Criar o projeto

1. Entre em https://console.firebase.google.com com uma conta Google.
2. Clique em **Criar um projeto** (ou **Adicionar projeto**), dê um nome, por exemplo `lua-de-mel`, e pode desativar o Google Analytics.

### 2. Criar o banco de dados

1. No menu do projeto, abra **Criação → Firestore Database** e clique em **Criar banco de dados**.
2. Escolha um local na Europa (por exemplo `eur3`) e o **modo de produção**.

### 3. Colar as regras de acesso

Na aba **Regras** do Firestore, apague o que estiver lá, cole o texto abaixo e clique em **Publicar**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /viagens/{viagem}/{colecao}/{doc} {
      allow read, write: if viagem.size() >= 20;
    }
  }
}
```

Os dados da viagem ficam guardados num endereço com um código longo e aleatório, criado pelo app. Só quem tem o convite (que contém esse código) consegue ler ou mudar a viagem.

### 4. Pegar a configuração do app da Web

1. Clique na engrenagem ao lado de **Visão geral do projeto → Configurações do projeto**.
2. Em **Seus apps**, clique no ícone da Web (`</>`), dê um apelido e clique em **Registrar app**. Não precisa ativar o Hosting.
3. Copie o trecho `const firebaseConfig = { … };` que aparece.

### 5. Ligar no app

1. No app, abra **Guia → Sincronizar os dois celulares → Configurar pela primeira vez**.
2. Cole o trecho copiado e toque em **Criar viagem compartilhada**. Os dados deste celular viram a base da viagem.
3. Toque em **Compartilhar convite** e mande o link só para a outra pessoa. Ao abrir o link no outro celular, ele entra na mesma viagem (os dados que estavam nele são substituídos pelos da viagem).

O selo no topo do app mostra o estado: **Sincronizado**, **Sem internet** (as mudanças ficam salvas e são enviadas quando a conexão voltar) ou **Só neste celular**.

### Limites

- O plano gratuito do Firebase sobra para duas pessoas (50 mil leituras e 20 mil gravações por dia, 1 GB de dados).
- Anexos de até 600 KB são sincronizados. Fotos são reduzidas automaticamente antes de salvar, então quase sempre cabem. PDFs maiores ficam só no celular onde foram adicionados, e o app avisa.
- O repositório é público: o roteiro padrão (sem endereços nem telefones) fica visível no código. O que vocês editam no app fica no celular e no Firestore, não no repositório.

## Desenvolvimento

Arquivos estáticos, sem build:

- `index.html`: estrutura da página
- `css/app.css`: estilos (temas claro e escuro)
- `js/data.js`: roteiro, reservas, checklist e orçamento originais
- `js/utils.js`: funções puras (horários, links, mapas, valores)
- `js/store.js`: estado, salvamento local, Firebase e anexos (IndexedDB)
- `js/weather.js`: previsão do tempo (Open-Meteo)
- `js/app.js`: interface
- `sw.js`: funcionamento offline

Testes: `node --test lua-de-mel/tests/*.test.mjs`

Para testar localmente: `python3 -m http.server` na raiz do repositório e abrir `http://localhost:8000/lua-de-mel/`.
