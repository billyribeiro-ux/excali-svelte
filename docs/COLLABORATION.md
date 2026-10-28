# Collaboration and sharing

svelte-draw's live collaboration and "shareable link" features are implemented client-side in
`svelte-draw-app/src/lib/app/collab/` (`Collab.ts`, `Portal.ts`) and
`svelte-draw-app/src/lib/app/data/` (`index.ts`, `firebase.ts`).

> **This repository does not provide any backend.** There is no WebSocket server, no Firebase
> project and no share-link service in this repo, and **Excalidraw's hosted services are not used**
> (nothing in the code defaults to them; the endpoints come from environment variables you set).
> With the variables unset, collaboration and share links cannot work. What *is* here is the client
> and the Firebase security-rule files in `infra/firebase/`.

## End-to-end encryption design

Verified in `packages/editor/data/encryption.ts`, `svelte-draw-app/src/lib/app/data/index.ts`,
`data/firebase.ts`, `collab/Portal.ts`, `collab/Collab.ts`.

- **Key generation.** The browser creates a key with WebCrypto `AES-GCM`, `ENCRYPTION_KEY_BITS = 128`
  (`packages/common/src/constants.ts`), exported as the JWK `k` string.
- **Key location.** The key lives only in the URL **hash**. A collaboration link is
  `<origin><path>#room=<roomId>,<key>` (`getCollaborationLink`); a share link is
  `<url>#json=<id>,<key>` (`exportToBackend`, with the comment that the key is stored as a hash
  "in order to never send it to the server"). URL fragments are not sent in HTTP requests by browsers.
  The room id is 10 random bytes, hex encoded (`ROOM_ID_BYTES`, `generateRoomId`); the key part must be 22
  characters or the link is rejected (`getCollaborationLinkData`).
- **Messages.** Every collaboration message is `JSON.stringify`-ed, UTF-8 encoded and encrypted with
  AES-GCM using a fresh random 12-byte IV (`createIV`, `IV_LENGTH_BYTES = 12`). The client sends
  `(roomId, encryptedBuffer, iv)` (`Portal._broadcastSocketData`). AES-GCM also authenticates the
  ciphertext, so tampered messages fail to decrypt.
- **Persisted scene.** The scene (elements only) is stored in Firestore document `scenes/<roomId>` as
  `{ sceneVersion, ciphertext, iv }`, the elements JSON encrypted with the room key
  (`saveToFirebase`, `createFirebaseSceneDocument`). Binary files (images) are compressed (pako) and encrypted
  with the same key and uploaded to Firebase Storage under `/files/rooms/<roomId>/<fileId>`.
- **Share links.** `exportToBackend` serialises the scene, compresses it (`pako@1`) and encrypts it
  (AES-GCM, new random key) and POSTs the bytes to `VITE_APP_BACKEND_V2_POST_URL`; the server returns
  `{ id }`. Images are uploaded encrypted to Storage under `/files/shareLinks/<id>/<fileId>`. Opening a
  share link fetches `VITE_APP_BACKEND_V2_GET_URL + id` and decrypts locally (`importFromBackend`).

### What the servers can and cannot see

| Can see | Cannot see |
| --- | --- |
| room id / share-link id, socket ids, connection IPs and timing | the encryption key (never leaves the URL hash unless the user shares the full link) |
| ciphertext, IVs, message sizes, scene version number (`sceneVersion` is stored in plaintext), file sizes and ids | element contents, text, images, usernames and cursor positions inside broadcast messages |
| the plaintext `user-follow` event payload (`{ userToFollow, action }`, emitted unencrypted by `broadcastUserFollowed`) | |

Honest limits: anyone who has the full link has the key. The Firestore/Storage rules in this repo
allow unauthenticated reads and writes by id (see below), so security relies on the secrecy of the
room id plus the key; a party that knows only the room id cannot read content but could overwrite or
fill the stored objects. There is no per-user authentication.

## Backend contract

### WebSocket server (socket.io) - `VITE_APP_WS_SERVER_URL`

The client connects with `socket.io-client` (`transports: ["websocket", "polling"]`, `Collab.ts`). The
server is not part of this repo; it must implement the following events as used by the client.

Server to client:

| Event | Payload | Client behaviour |
| --- | --- | --- |
| `init-room` | none | client emits `join-room` |
| `new-user` | socket id | an existing client broadcasts the full scene (`SCENE_INIT`) |
| `room-user-change` | `SocketId[]` | collaborator list updated |
| `first-in-room` | none | client loads the scene from Firestore |
| `client-broadcast` | `(encryptedData: ArrayBuffer, iv: Uint8Array)` | decrypted and applied |
| `user-follow-room-change` | `SocketId[]` | followers of this user |

Client to server:

| Event | Arguments |
| --- | --- |
| `join-room` | `roomId` |
| `server-broadcast` | `(roomId, encryptedBuffer, iv)` |
| `server-volatile-broadcast` | `(roomId, encryptedBuffer, iv)` (cursor, idle, viewport bounds) |
| `user-follow` | `{ userToFollow, action: "FOLLOW" \| "UNFOLLOW" }` |

Decrypted message types (`WS_SUBTYPES`): `SCENE_INIT`, `SCENE_UPDATE`, `MOUSE_LOCATION`, `IDLE_STATUS`,
`USER_VISIBLE_SCENE_BOUNDS`. The server only relays opaque bytes between sockets in a room. Upstream
documents a reference relay implementation in its `excalidraw-room` project (the old `.env.development`
comment links it); whether it is wire-compatible with your version of this client is **UNVERIFIED**.

### Firebase - `VITE_APP_FIREBASE_CONFIG`

A JSON web-app config (`apiKey`, `projectId`, `storageBucket`, ...). If it fails to parse, the client logs a
warning and uses `{}` (`data/firebase.ts`). Used for Firestore (`scenes/<roomId>`) and Storage
(`/files/rooms/...`, `/files/shareLinks/...`). Files are fetched from
`https://firebasestorage.googleapis.com/v0/b/<storageBucket>/o/...?alt=media`.

Rules provided in `infra/firebase/`:

- `firestore.rules`: `get` and `write` allowed for everyone, `list` denied ("never set this to true, otherwise anyone can delete anyone else's drawing").
- `storage.rules`: `get`/`write` allowed under `{files}/rooms/{room}/{file}` and `{files}/shareLinks/{shareLink}/{file}`.
- `firebase.json` and `firestore.indexes.json` wire these to the Firebase CLI. Deploying them is up to you (`firebase deploy` against your own project; not run or tested here).

### Share-link backend - `VITE_APP_BACKEND_V2_GET_URL` / `VITE_APP_BACKEND_V2_POST_URL`

- `POST <POST_URL>` with the encrypted bytes as the raw request body (no content type is set by the client). Response JSON:
  `{ "id": "<id>" }` on success, or `{ "error_class": "RequestTooLargeError" }` (the client shows the "too big" message); anything else is a generic failure.
- `GET <GET_URL><id>` returns the same bytes: the versioned container produced by `compressData` in `packages/editor/data/encode.ts` (encoding info, IV, ciphertext), with a legacy fallback for older links (IV prefix, or a fixed all-zero IV; see `legacy_decodeFromBackend`).

### Related optional endpoints

`VITE_APP_LIBRARY_URL`, `VITE_APP_LIBRARY_BACKEND` (library browse/publish) and `VITE_APP_AI_BACKEND` (AI features) are also
external services that this repo does not include. See [DEPLOYMENT.md](./DEPLOYMENT.md).
