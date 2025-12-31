/**
 * Type declarations for tinode-sdk
 *
 * Based on official Tinode JS API documentation:
 * https://tinode.github.io/js-api/tinode.js.html
 * https://tinode.github.io/js-api/topic.js.html
 *
 * The tinode-sdk npm package does not include TypeScript declarations.
 * These types cover the core functionality used by our chat integration.
 *
 * @see https://github.com/tinode/tinode-js
 */

declare module 'tinode-sdk' {
  // ==========================================================================
  // Configuration Types
  // ==========================================================================

  export interface TinodeConfig {
    /** Application identifier shown in 'User-Agent' (optional) */
    appName?: string;
    /** Server hostname and optional port number */
    host: string;
    /** API key for the server */
    apiKey: string;
    /** Transport type: 'ws' (WebSocket) or 'lp' (long polling) */
    transport?: 'ws' | 'lp';
    /** Use secure connection (wss:// or https://) */
    secure?: boolean;
    /** Platform identifier */
    platform?: 'ios' | 'web' | 'android';
    /** Enable IndexedDB caching for messages */
    persist?: boolean;
  }

  // ==========================================================================
  // Access Mode
  // ==========================================================================

  export class AccessMode {
    given: number;
    want: number;
    mode: number;

    constructor(acs?: { given?: string | number; want?: string | number; mode?: string | number });

    static decode(str: string | number | null): number | null;
    static encode(val: number | null): string | null;
    static update(val: number, upd: string): number;
    static diff(a1: string | number, a2: string | number): number;

    toString(): string;
    jsonHelper(): { mode: string | null; given: string | null; want: string | null };

    setMode(m: string | number): this;
    updateMode(u: string): this;
    getMode(): string | null;

    setGiven(g: string | number): this;
    updateGiven(u: string): this;
    getGiven(): string | null;

    setWant(w: string | number): this;
    updateWant(u: string): this;
    getWant(): string | null;

    getMissing(): string | null;
    getExcessive(): string | null;
    updateAll(val: { given?: string; want?: string }): this;

    isOwner(side?: 'given' | 'want' | 'mode'): boolean;
    isPresencer(side?: 'given' | 'want' | 'mode'): boolean;
    isMuted(side?: 'given' | 'want' | 'mode'): boolean;
    isJoiner(side?: 'given' | 'want' | 'mode'): boolean;
    isReader(side?: 'given' | 'want' | 'mode'): boolean;
    isWriter(side?: 'given' | 'want' | 'mode'): boolean;
    isApprover(side?: 'given' | 'want' | 'mode'): boolean;
    isSharer(side?: 'given' | 'want' | 'mode'): boolean;
    isDeleter(side?: 'given' | 'want' | 'mode'): boolean;
    isAdmin(side?: 'given' | 'want' | 'mode'): boolean;
  }

  // ==========================================================================
  // Message & Content Types
  // ==========================================================================

  export interface ServerMessage {
    topic?: string;
    from?: string;
    ts?: string;
    seq?: number;
    head?: Record<string, unknown>;
    content?: unknown;
  }

  export interface ControlMessage {
    id?: string;
    topic?: string;
    code: number;
    text: string;
    ts?: string;
    params?: Record<string, unknown>;
  }

  export interface PresenceMessage {
    topic: string;
    src?: string;
    what: string;
    seq?: number;
    clear?: number;
    ua?: string;
    act?: string;
    tgt?: string;
    acs?: { given?: string; want?: string; mode?: string };
  }

  export interface MetaMessage {
    topic: string;
    ts?: string;
    desc?: TopicDescription;
    sub?: TopicSubscription[];
    tags?: string[];
    cred?: Credential[];
    del?: { clear: number; delseq: Array<{ low: number; hi?: number }> };
  }

  export interface AuthToken {
    token: string;
    expires: Date;
  }

  export interface Credential {
    meth: string;
    val: string;
    resp?: string;
    done?: boolean;
    params?: Record<string, unknown>;
  }

  // ==========================================================================
  // Topic Types
  // ==========================================================================

  export interface TopicDescription {
    created?: string;
    updated?: string;
    touched?: string;
    defacs?: DefAcs;
    acs?: { given?: string; want?: string; mode?: string };
    seq?: number;
    read?: number;
    recv?: number;
    clear?: number;
    public?: Record<string, unknown>;
    trusted?: Record<string, unknown>;
    private?: Record<string, unknown>;
  }

  export interface DefAcs {
    auth?: string;
    anon?: string;
  }

  export interface TopicSubscription {
    user?: string;
    topic?: string;
    updated?: string;
    touched?: string;
    acs?: { given?: string; want?: string; mode?: string };
    read?: number;
    recv?: number;
    clear?: number;
    public?: Record<string, unknown>;
    trusted?: Record<string, unknown>;
    private?: Record<string, unknown>;
    online?: boolean;
    seen?: { when?: string; ua?: string };
  }

  export interface GetQuery {
    what?: string;
    desc?: GetOptsType;
    sub?: GetOptsType & { user?: string; topic?: string; limit?: number };
    data?: GetDataType;
    del?: GetDataType;
  }

  export interface GetOptsType {
    ims?: string | Date;
    limit?: number;
  }

  export interface GetDataType {
    since?: number;
    before?: number;
    limit?: number;
  }

  export interface SetParams {
    desc?: SetDesc;
    sub?: SetSub;
    tags?: string[];
    cred?: Credential;
    attachments?: string[];
  }

  export interface SetDesc {
    defacs?: DefAcs;
    public?: Record<string, unknown>;
    trusted?: Record<string, unknown>;
    private?: Record<string, unknown>;
  }

  export interface SetSub {
    user?: string;
    mode?: string;
  }

  export interface DelRange {
    low: number;
    hi?: number;
  }

  // ==========================================================================
  // Drafty (Rich Text Format)
  // ==========================================================================

  export interface DraftyDocument {
    txt?: string;
    fmt?: Array<{ at?: number; len?: number; tp?: string; key?: number }>;
    ent?: Array<{ tp: string; data: Record<string, unknown> }>;
  }

  // Drafty descriptor types for media/attachments
  export interface ImageDesc {
    mime: string;
    bits?: string;
    refurl?: string;
    preview?: string;
    width: number;
    height: number;
    filename?: string;
    size?: number;
  }

  export interface VideoDesc {
    mime: string;
    bits?: string;
    refurl?: string;
    preref?: string;
    preview?: string;
    width: number;
    height: number;
    duration?: number;
    filename?: string;
    size?: number;
  }

  export interface AudioDesc {
    mime: string;
    bits?: string;
    refurl?: string;
    preview?: string;
    duration: number;
    filename?: string;
    size?: number;
  }

  export interface AttachmentDesc {
    mime?: string;
    data?: string;
    filename?: string;
    refurl?: string;
    size?: number;
  }

  export namespace Drafty {
    // Core methods
    /** Initialize a new Drafty document from plain text */
    function init(plainText: string): DraftyDocument | null;
    /** Parse markdown-like content into Drafty */
    function parse(content: string): DraftyDocument | null;
    /** Format Drafty document using custom formatter */
    function format(doc: DraftyDocument, formatter: unknown, context?: unknown): unknown;
    /** Check if object is a valid Drafty document */
    function isValid(doc: unknown): boolean;

    // Plain text conversion
    /** Convert Drafty to plain text (stripping formatting) */
    function toPlainText(doc: DraftyDocument | string | null): string;
    /** Convert Drafty to markdown */
    function toMarkdown(doc: DraftyDocument): string;
    /** Convert Drafty to HTML (UNSAFE - not sanitized) */
    function UNSAFE_toHTML(doc: DraftyDocument): string;
    /** Create a preview of the document */
    function preview(doc: DraftyDocument | string, limit: number, forwarding?: boolean): DraftyDocument;
    /** Shorten document to specified limit */
    function shorten(content: DraftyDocument | string, limit: number, light?: boolean): DraftyDocument;

    // Entity methods
    /** Check if document has entities */
    function hasEntities(doc: DraftyDocument): boolean;
    /** Iterate over entities. Callback receives (data, index, type). Return truthy to stop. */
    function entities(doc: DraftyDocument, callback: (data: Record<string, unknown>, index: number, type: string) => boolean | void, context?: unknown): void;
    /** Get MIME type from entity data (defaults to 'text/plain') */
    function getEntityMimeType(entData: Record<string, unknown>): string;
    /** Get size from entity data (defaults to 0) */
    function getEntitySize(entData: Record<string, unknown>): number;
    /** Get HTML attribute value for a style */
    function attrValue(style: string, data: Record<string, unknown>): Record<string, unknown> | undefined;
    /** Remove dangerous entities from document */
    function sanitizeEntities(doc: DraftyDocument): DraftyDocument;
    /** Get HTML tag name for a style code */
    function tagName(style: string): string | undefined;
    /** Iterate over styles in document. Callback receives (tp, at, len, key, index). Return truthy to stop. */
    function styles(content: DraftyDocument, callback: (tp: string, at: number, len: number, key: number | undefined, index: number) => boolean | void, context?: unknown): void;
    /** Get content type for Drafty documents */
    function getContentType(): string;

    // Attachment methods
    /** Check if document has file attachments */
    function hasAttachments(doc: DraftyDocument): boolean;
    /** Iterate over attachments. Callback receives (data, count, 'EX'). Return truthy to stop. */
    function attachments(doc: DraftyDocument, callback: (data: Record<string, unknown>, count: number, type: string) => boolean | void, context?: unknown): void;
    /** Attach a file to document using descriptor */
    function attachFile(content: DraftyDocument, attachmentDesc: AttachmentDesc): DraftyDocument;
    /** Attach JSON data to document */
    function attachJSON(doc: DraftyDocument, data: Record<string, unknown>): DraftyDocument;
    /** Get download URL from entity data */
    function getDownloadUrl(entData: { ref?: string; url?: string }): string | null;
    /** Get preview URL from entity data */
    function getPreviewUrl(entData: { ref?: string }): string | null;

    // Content creation
    /** Create a mention element */
    function mention(name: string, uid: string): DraftyDocument;
    /** Create a quote element */
    function quote(header: string, uid: string, body: DraftyDocument): DraftyDocument;
    /** Create reply content from original message */
    function replyContent(original: DraftyDocument | string, limit: number): DraftyDocument;
    /** Create forwarded content from original */
    function forwardedContent(original: DraftyDocument | string): DraftyDocument;

    // Append/Insert methods
    /** Append content to document */
    function append(doc: DraftyDocument, content: DraftyDocument | string): DraftyDocument;
    /** Append a line break */
    function appendLineBreak(doc: DraftyDocument): DraftyDocument;
    /** Append an image using descriptor */
    function appendImage(content: DraftyDocument, imageDesc: ImageDesc): DraftyDocument;
    /** Append audio using descriptor */
    function appendAudio(content: DraftyDocument, audioDesc: AudioDesc): DraftyDocument;
    /** Append a button */
    function appendButton(content: DraftyDocument | string, title: string, name: string, actionType: string, actionValue: string, refUrl?: string): DraftyDocument;
    /** Append a link */
    function appendLink(doc: DraftyDocument, linkData: { txt: string; url: string }): DraftyDocument;

    /** Insert an image at position using descriptor */
    function insertImage(content: DraftyDocument, at: number, imageDesc: ImageDesc): DraftyDocument;
    /** Insert audio at position using descriptor */
    function insertAudio(content: DraftyDocument, at: number, audioDesc: AudioDesc): DraftyDocument;
    /** Insert a button at position (no title param) */
    function insertButton(content: DraftyDocument | string, at: number, len: number, name: string, actionType: string, actionValue: string, refUrl?: string): DraftyDocument | null;
    /** Insert video at position using descriptor */
    function insertVideo(content: DraftyDocument, at: number, videoDesc: VideoDesc): DraftyDocument;

    // Wrapping
    /** Wrap content as a form at position */
    function wrapAsForm(content: DraftyDocument | string, at: number, len: number): DraftyDocument;
    /** Wrap content into a style at position (defaults: at=0, len=content length) */
    function wrapInto(content: DraftyDocument | string, style: string, at?: number, len?: number): DraftyDocument;

    // Video call
    /** Create a video call document */
    function videoCall(audioOnly?: boolean): DraftyDocument;
    /** Update an existing video call document */
    function updateVideoCall(content: DraftyDocument, params: { duration?: number; state?: string }): DraftyDocument;

    // State checks
    /** Check if document is plain text (no formatting) */
    function isPlainText(doc: DraftyDocument): boolean;
    /** Check if entity data indicates pending upload */
    function isProcessing(entData: Record<string, unknown>): boolean;
    /** Check if MIME type is a form response type */
    function isFormResponseType(mimeType: string): boolean;
  }

  // ==========================================================================
  // Topic Class
  // ==========================================================================

  export class Topic<
    PublicType = Record<string, unknown>,
    PrivateType = Record<string, unknown>,
    TrustedType = Record<string, unknown>,
  > {
    // Static methods for topic name classification
    static topicType(name: string): 'me' | 'fnd' | 'grp' | 'p2p' | 'sys' | undefined;
    static isMeTopicName(name: string): boolean;
    static isSelfTopicName(name: string): boolean;
    static isGroupTopicName(name: string): boolean;
    static isP2PTopicName(name: string): boolean;
    static isCommTopicName(name: string): boolean;
    static isNewGroupTopicName(name: string): boolean;
    static isChannelTopicName(name: string): boolean;

    // Fields
    name: string;
    acs: AccessMode;
    private: PrivateType | null;
    public: PublicType | null;
    trusted: TrustedType | null;
    seq: number;
    read: number;
    recv: number;
    unread: number;
    clear: number;
    touched: Date;
    updated: Date;
    created: Date;
    defacs: DefAcs | null;

    // Callbacks
    onData: ((msg: ServerMessage) => void) | null;
    onMeta: ((msg: MetaMessage) => void) | null;
    onPres: ((msg: PresenceMessage) => void) | null;
    onInfo: ((msg: PresenceMessage) => void) | null;
    onMetaSub: ((sub: TopicSubscription) => void) | null;
    onMetaDesc: ((topic: Topic) => void) | null;
    onSubsUpdated: ((subs: string[], count?: number) => void) | null;
    onTagsUpdated: ((tags: string[]) => void) | null;
    onCredsUpdated: ((creds: Credential[]) => void) | null;
    onAuxUpdated: ((aux: Record<string, unknown>) => void) | null;
    onDeleteTopic: (() => void) | null;
    onAllMessagesReceived: ((count: number) => void) | null;

    constructor(name: string, callbacks?: Partial<TopicCallbacks>);

    // Subscription
    subscribe(getParams?: GetQuery, setParams?: SetParams): Promise<ControlMessage>;
    leave(unsub?: boolean): Promise<ControlMessage>;
    leaveDelayed(unsub: boolean, delay: number): void;
    isSubscribed(): boolean;

    // Messaging
    publish(data: string | DraftyDocument, noEcho?: boolean): Promise<ControlMessage>;
    /** Publish a message created by createMessage(). Attachments are extracted internally. */
    publishMessage(pub: unknown): Promise<ControlMessage>;
    publishDraft(pub: unknown, prom?: Promise<unknown>): Promise<ControlMessage>;
    createMessage(data: string | DraftyDocument, noEcho?: boolean): unknown;

    // Message retrieval
    getMessagesPage(limit: number, gaps?: Array<{ low: number; hi?: number }>, min?: number, max?: number, newer?: boolean): Promise<ControlMessage>;
    getPinnedMessages(): Promise<ControlMessage>;
    /** Iterate over messages. Callback receives (msg, prevMsg, nextMsg, index) */
    messages(callback?: (msg: ServerMessage, prevMsg: ServerMessage | undefined, nextMsg: ServerMessage | undefined, idx: number) => void, sinceId?: number, beforeId?: number, context?: unknown): void;
    findMessage(seq: number): ServerMessage | undefined;
    latestMessage(): ServerMessage | undefined;
    latestMsgVersion(seq: number): ServerMessage | null;
    /** Iterate over message versions. Callback receives (msg, prevMsg, nextMsg, index) */
    messageVersions(origSeq: number, callback?: (msg: ServerMessage, prevMsg: ServerMessage | undefined, nextMsg: ServerMessage | undefined, idx: number) => void, context?: unknown): void;
    /** Iterate over queued messages (wraps messages with LOCAL_SEQID). Callback receives (msg, prevMsg, nextMsg, index) */
    queuedMessages(callback: (msg: ServerMessage, prevMsg: ServerMessage | undefined, nextMsg: ServerMessage | undefined, idx: number) => void, context?: unknown): void;
    maxMsgSeq(): number;
    minMsgSeq(): number;
    maxClearId(): number;
    messageCount(): number;

    // Metadata
    getMeta(params: GetQuery): Promise<ControlMessage>;
    setMeta(params: SetParams): Promise<ControlMessage>;
    startMetaQuery(): MetaGetBuilder;
    pinMessage(seq: number, pin: boolean): Promise<ControlMessage>;

    // Notifications
    note(what: 'recv' | 'read', seq: number): void;
    noteRecv(seq: number): void;
    noteRead(seq?: number): void;
    noteKeyPress(): void;
    noteRecording(audioOnly?: boolean): void;
    videoCall(evt: string, seq: number, payload?: string): Promise<ControlMessage>;

    // Message management
    delMessages(ranges: DelRange[], hard?: boolean): Promise<ControlMessage>;
    delMessagesAll(hardDel?: boolean): Promise<ControlMessage>;
    delMessagesList(list: number[], hardDel?: boolean): Promise<ControlMessage>;
    delMessagesEdits(seq: number, hardDel?: boolean): Promise<ControlMessage>;
    flushMessage(seqId: number): unknown | undefined;
    flushMessageRange(fromId: number, untilId: number): unknown[];
    swapMessageId(pub: unknown, newSeqId: number): void;
    cancelSend(seqId: number): boolean;

    // Message status
    msgStatus(msg: unknown, upd?: boolean): number;
    msgReadCount(seq: number): number;
    msgRecvCount(seq: number): number;
    msgReceiptCount(what: 'read' | 'recv', seq: number): number;
    msgHasMoreMessages(min: number, max: number, newer: boolean): Array<{ low: number; hi?: number }>;
    isNewMessage(seqId: number): boolean;

    // Topic info
    getType(): 'me' | 'fnd' | 'grp' | 'p2p' | 'sys' | undefined;
    getAccessMode(): AccessMode;
    setAccessMode(acs: AccessMode | { given?: string; want?: string; mode?: string }): AccessMode;
    getDefaultAccess(): DefAcs | null;
    isArchived(): boolean;
    isMeType(): boolean;
    isSelfType(): boolean;
    isGroupType(): boolean;
    isP2PType(): boolean;
    isChannelType(): boolean;
    isCommType(): boolean;

    // Auxiliary data
    aux(key: string): unknown;

    // Subscribers
    /** Iterate over subscribers. Callback receives (sub, userId, users) */
    subscribers(callback?: (sub: TopicSubscription, userId: string, users: Record<string, TopicSubscription>) => void, context?: unknown): void;
    subscriber(uid: string): TopicSubscription | undefined;
    userDesc(uid: string): TopicSubscription | undefined;
    p2pPeerDesc(): TopicSubscription | undefined;

    // Subscription management
    updateMode(uid: string | null, update: string): Promise<ControlMessage>;
    invite(userId: string, mode?: string): Promise<ControlMessage>;
    delSubscription(user: string): Promise<ControlMessage>;
    archive(arch: boolean): Promise<ControlMessage>;

    // Tags
    tags(): string[];
    alias(): string | undefined;

    // Topic deletion
    delTopic(hard?: boolean): Promise<ControlMessage>;
  }

  export interface TopicCallbacks {
    onData: (msg: ServerMessage) => void;
    onMeta: (msg: MetaMessage) => void;
    onPres: (msg: PresenceMessage) => void;
    onInfo: (msg: unknown) => void;
    onMetaSub: (sub: TopicSubscription) => void;
    onMetaDesc: (topic: Topic) => void;
    onSubsUpdated: (subs: string[], count?: number) => void;
    onTagsUpdated: (tags: string[]) => void;
    onCredsUpdated: (creds: Credential[]) => void;
    onAuxUpdated: (aux: Record<string, unknown>) => void;
    onDeleteTopic: () => void;
    onAllMessagesReceived: (count: number) => void;
  }

  // ==========================================================================
  // TopicMe (User's personal topic)
  // ==========================================================================

  export class TopicMe extends Topic {
    /** Callback when a contact is updated */
    onContactUpdate: ((what: string, contact: TopicSubscription) => void) | null;

    /** Publishing to 'me' is not supported - always returns rejected Promise */
    publish(): Promise<never>;

    /** Iterate over cached contacts (topics), callback receives (topic, cacheKey) */
    contacts(callback?: (contact: Topic, key: string) => void, filter?: (contact: Topic) => boolean, context?: unknown): void;
    getContact(name: string): TopicSubscription | undefined;
    getAccessMode(name?: string): AccessMode | null;
    /** Check if a contact is archived. @param name - UID or topic name (required for TopicMe, checks contact not self) */
    isArchived(name?: string): boolean;
    getCredentials(): Credential[];
    delCredential(method: string, value: string): Promise<ControlMessage>;
    /** Pin or unpin a topic. If pin is undefined, toggles current state */
    pinTopic(topic: string, pin?: boolean): Promise<ControlMessage>;
    /** Get the rank of a pinned topic (0 if unpinned, 1..N if pinned) */
    pinnedTopicRank(topic: string): number;
  }

  // ==========================================================================
  // TopicFnd (Discovery topic)
  // ==========================================================================

  export class TopicFnd extends Topic {
    /** Publishing to 'fnd' is not supported - always returns rejected Promise */
    publish(): Promise<never>;

    /** Iterate through cached contacts, callback receives (contact, key, contacts) */
    contacts(callback?: (contact: TopicSubscription, key: string, contacts: Record<string, TopicSubscription>) => void, context?: unknown): void;
    /** Check if a tag is unique. @param caller - Identifier string for the caller */
    checkTagUniqueness(tag: string, caller: string): Promise<boolean>;
  }

  // ==========================================================================
  // MetaGetBuilder
  // ==========================================================================

  export class MetaGetBuilder {
    constructor(parent?: Topic);

    withData(since?: number, before?: number, limit?: number): this;
    withLaterData(limit?: number): this;
    withEarlierData(limit?: number): this;
    withDataRanges(ranges: DelRange[], limit?: number): this;
    withDataList(list: number[]): this;
    withDel(since?: number, limit?: number): this;
    withLaterDel(limit?: number): this;
    withDesc(ims?: Date): this;
    withLaterDesc(): this;
    withSub(ims?: Date, limit?: number, identifier?: string): this;
    withLaterSub(limit?: number): this;
    withOneSub(ims?: Date, user?: string): this;
    withLaterOneSub(userOrTopic?: string): this;
    withTags(): this;
    withCred(): this;
    withAux(): this;
    extract(what: string): GetQuery[keyof GetQuery];
    build(): GetQuery;
  }

  // ==========================================================================
  // LargeFileHelper
  // ==========================================================================

  export class LargeFileHelper {
    static setNetworkProvider(xhrProvider: unknown): void;

    constructor(tinode: Tinode, version?: string);

    uploadWithBaseUrl(
      baseUrl: string,
      data: File | Blob,
      avatarFor?: string,
      /** Progress callback receives float 0..1 */
      onProgress?: (progress: number) => void,
      onSuccess?: (ctrl: ControlMessage) => void,
      /** Failure callback receives control object or null */
      onFailure?: (ctrl: ControlMessage | null) => void,
    ): Promise<unknown>;

    upload(
      data: File | Blob,
      avatarFor?: string,
      /** Progress callback receives float 0..1 */
      onProgress?: (progress: number) => void,
      onSuccess?: (ctrl: ControlMessage) => void,
      /** Failure callback receives control object or null */
      onFailure?: (ctrl: ControlMessage | null) => void,
    ): Promise<unknown>;

    download(
      relativeUrl: string,
      filename?: string,
      mimetype?: string,
      /** Progress callback receives bytes loaded (not ratio, due to gzip) */
      onProgress?: (loaded: number) => void,
      /** Error callback receives error message string or Error object */
      onError?: (error: Error | string) => void,
    ): Promise<void>;

    cancel(): void;
  }

  // ==========================================================================
  // Main Tinode Class
  // ==========================================================================

  // Note: tinode-sdk exports Tinode as both default and named export.
  // The UMD bundle uses named exports, so we export it both ways for compatibility.
  export class Tinode {
    // Static constants
    static readonly MESSAGE_STATUS_NONE: number;
    static readonly MESSAGE_STATUS_QUEUED: number;
    static readonly MESSAGE_STATUS_SENDING: number;
    static readonly MESSAGE_STATUS_FAILED: number;
    static readonly MESSAGE_STATUS_FATAL: number;
    static readonly MESSAGE_STATUS_SENT: number;
    static readonly MESSAGE_STATUS_RECEIVED: number;
    static readonly MESSAGE_STATUS_READ: number;
    static readonly MESSAGE_STATUS_TO_ME: number;
    static readonly DEL_CHAR: string;
    /** Key for getServerParam() - returns max message size limit */
    static readonly MAX_MESSAGE_SIZE: string;
    /** Key for getServerParam() - returns max subscriber count limit */
    static readonly MAX_SUBSCRIBER_COUNT: string;
    /** Key for getServerParam() - returns max tag count limit */
    static readonly MAX_TAG_COUNT: string;
    /** Key for getServerParam() - returns max file upload size limit */
    static readonly MAX_FILE_UPLOAD_SIZE: string;
    /** Key for getServerParam() - returns required credential validators */
    static readonly REQ_CRED_VALIDATORS: string;
    /** Key for getServerParam() - returns min tag length */
    static readonly MIN_TAG_LENGTH: string;
    /** Key for getServerParam() - returns max tag length */
    static readonly MAX_TAG_LENGTH: string;
    /** Key for getServerParam() - returns message delete age limit */
    static readonly MSG_DELETE_AGE: string;
    static readonly TAG_ALIAS: string;
    static readonly TAG_EMAIL: string;
    static readonly TAG_PHONE: string;
    static readonly URI_TOPIC_ID_PREFIX: string;

    // Static methods
    static setNetworkProviders(wsProvider: unknown, xhrProvider?: unknown): void;
    static setDatabaseProvider(idbProvider: unknown): void;
    /**
     * Set a custom storage provider (e.g., SQLiteStorage for React Native).
     * Must be called BEFORE creating Tinode instance with persist: true.
     * @param storage - Storage implementation (DB, SQLiteStorage, or custom)
     */
    static setStorageProvider(storage: Storage): void;
    static getVersion(): string;
    static getLibrary(): string;
    static credential(meth: string | Credential, val?: string, params?: Record<string, unknown>, resp?: string): Credential[] | null;
    static topicType(name: string): 'me' | 'fnd' | 'grp' | 'p2p' | 'sys' | undefined;
    static isMeTopicName(name: string): boolean;
    static isSelfTopicName(name: string): boolean;
    static isGroupTopicName(name: string): boolean;
    static isP2PTopicName(name: string): boolean;
    static isCommTopicName(name: string): boolean;
    static isNewGroupTopicName(name: string): boolean;
    static isChannelTopicName(name: string): boolean;
    static isNullValue(str: string): boolean;
    static isServerAssignedSeq(seq: number): boolean;
    static isValidTagValue(tag: string): boolean;
    static tagSplit(tag: string): { prefix: string; value: string } | null;
    static setUniqueTag(tags: string[], uniqueTag: string): string[];
    static clearTagPrefix(tags: string[], prefix: string): string[];
    static tagByPrefix(tags: string[], prefix: string): string | undefined;

    // Callbacks
    onWebsocketOpen: (() => void) | null;
    onConnect: ((code: number, text: string, params: Record<string, unknown>) => void) | null;
    onDisconnect: ((err: Error | null) => void) | null;
    onLogin: ((code: number, text: string) => void) | null;
    onCtrlMessage: ((ctrl: ControlMessage) => void) | null;
    onDataMessage: ((data: ServerMessage) => void) | null;
    onPresMessage: ((pres: PresenceMessage) => void) | null;
    onMetaMessage: ((meta: MetaMessage) => void) | null;
    onInfoMessage: ((info: unknown) => void) | null;
    onMessage: ((packet: unknown) => void) | null;
    onRawMessage: ((text: string) => void) | null;
    onNetworkProbe: (() => void) | null;
    onAutoreconnectIteration: ((timeout: number, promise: Promise<unknown> | null) => void) | null;

    constructor(config: TinodeConfig, onComplete?: (err?: Error) => void);

    // Connection
    connect(host?: string): Promise<ControlMessage>;
    disconnect(): void;
    reconnect(force?: boolean): void;
    isConnected(): boolean;
    networkProbe(): void;

    // Authentication
    login(scheme: string, secret: string | Uint8Array, cred?: Credential[]): Promise<ControlMessage>;
    loginBasic(username: string, password: string, cred?: Credential[]): Promise<ControlMessage>;
    loginToken(token: string, cred?: Credential[]): Promise<ControlMessage>;
    account(uid: string | null, scheme: string, secret: string | Uint8Array, login?: boolean, params?: AccountParams): Promise<ControlMessage>;
    createAccount(scheme: string, secret: string | Uint8Array, login: boolean, params?: AccountParams): Promise<ControlMessage>;
    createAccountBasic(username: string, password: string, params?: AccountParams): Promise<ControlMessage>;
    updateAccountBasic(uid: string, username: string, password: string, params?: AccountParams): Promise<ControlMessage>;
    requestResetAuthSecret(scheme: string, method: string, value: string): Promise<ControlMessage>;

    isAuthenticated(): boolean;
    getAuthToken(): AuthToken | null;
    setAuthToken(token: AuthToken): void;
    getCurrentUserID(): string | undefined;
    getCurrentLogin(): string | undefined;
    isMe(uid: string): boolean;
    getNextUniqueId(): string | undefined;

    // Topic management
    getTopic(topicName: string): Topic | undefined;
    getMeTopic(): TopicMe;
    getFndTopic(): TopicFnd;
    newGroupTopicName(isChan?: boolean): string;
    cacheGetTopic(topicName: string): Topic | undefined;
    cacheRemTopic(topicName: string): void;
    /** Iterate over cached topics. Return true from callback to stop enumeration. */
    mapTopics(func: (topic: Topic, key: string) => boolean | void, context?: unknown): void;
    isTopicCached(topicName: string): boolean;
    isTopicOnline(name: string): boolean;
    getTopicAccessMode(name: string): AccessMode | null;

    // Subscription
    subscribe(topicName: string, getParams?: GetQuery, setParams?: SetParams): Promise<ControlMessage>;
    leave(topic: string, unsub?: boolean): Promise<ControlMessage>;

    // Messaging
    publish(topicName: string, content: string | DraftyDocument, noEcho?: boolean): Promise<ControlMessage>;
    publishMessage(pub: unknown, attachments?: unknown[]): Promise<ControlMessage>;
    createMessage(topic: string, content: string | DraftyDocument, noEcho?: boolean): unknown;
    getMeta(topic: string, params: GetQuery): Promise<ControlMessage>;
    setMeta(topic: string, params: SetParams): Promise<ControlMessage>;
    delMessages(topic: string, ranges: DelRange[], hard?: boolean): Promise<ControlMessage>;
    note(topicName: string, what: 'recv' | 'read', seq: number): void;
    noteKeyPress(topicName: string, type?: string): void;
    videoCall(topicName: string, seq: number, evt: string, payload?: unknown): Promise<ControlMessage>;

    // Topic deletion
    delTopic(topicName: string, hard?: boolean): Promise<ControlMessage>;
    delSubscription(topicName: string, user: string): Promise<ControlMessage>;
    delCredential(method: string, value: string): Promise<ControlMessage>;
    delCurrentUser(hard?: boolean): Promise<ControlMessage>;

    // Server info
    hello(): Promise<ControlMessage>;
    getServerInfo(): ServerInfo | null;
    getServerParam(name: string, defaultValue?: unknown): unknown;
    authorizeURL(url: string): string;
    report(action: string, target: string): Promise<ControlMessage>;

    // Push notifications
    oobNotification(data: unknown): void;
    /** Set or clear device token. Pass falsy value (null/undefined/false) to clear. */
    setDeviceToken(dt: string | null | undefined | false): boolean;

    // Utilities
    enableLogging(enabled: boolean, trimLongStrings?: boolean): void;
    setHumanLanguage(hl: string): void;
    getLargeFileHelper(): LargeFileHelper;
    initStorage(): Promise<void>;
    clearStorage(): Promise<void>;
    logger(str: string, ...args: unknown[]): void;

    /** @deprecated Control whether to send acknowledgments */
    wantAkn(status: boolean): void;
  }

  export interface AccountParams {
    fn?: string;
    photo?: string | { type: string; data: string };
    private?: Record<string, unknown>;
    tags?: string[];
    cred?: Credential[];
    token?: string;
    attachments?: string[];
    /** Temporary authentication scheme for password reset */
    scheme?: string;
    /** Temporary authentication secret for password reset */
    secret?: string;
    desc?: {
      defacs?: DefAcs;
      public?: Record<string, unknown>;
      private?: Record<string, unknown>;
      trusted?: Record<string, unknown>;
    };
  }

  export interface ServerInfo {
    ver: string;
    build: string;
    sid?: string;
    maxFileUploadSize?: number;
    maxMessageSize?: number;
    maxSubscriberCount?: number;
    maxTagCount?: number;
    maxTagLength?: number;
    minTagLength?: number;
    /** Required credential methods */
    reqCred?: {
      auth?: string[];
      anonauthSet?: string[];
    };
  }

  // ==========================================================================
  // Database/Storage Types
  // ==========================================================================

  /**
   * Query parameters for reading messages or deletion logs.
   */
  export interface GetDataType {
    /** Return messages with seq >= since */
    since?: number;
    /** Return messages with seq < before */
    before?: number;
    /** Maximum number of messages to return */
    limit?: number;
    /** Specific ranges to fetch (alternative to since/before) */
    ranges?: IdRange[];
  }

  /**
   * Message ID range used in deletion logs and queries.
   */
  export interface IdRange {
    /** Lower boundary (inclusive) */
    low: number;
    /** Upper boundary (exclusive). If omitted, represents single message at low */
    hi?: number;
  }

  /**
   * Cached user data structure.
   */
  export interface CachedUser {
    uid: string;
    public: Record<string, unknown>;
  }

  /**
   * Deletion log entry structure.
   */
  export interface DelLogEntry {
    topic: string;
    /** Deletion transaction ID (clear value) */
    clear: number;
    /** Lower boundary of deleted range */
    low: number;
    /** Upper boundary of deleted range */
    hi: number;
  }

  /**
   * Serialized message for storage.
   */
  export interface StoredMessage {
    topic: string;
    seq: number;
    ts?: string;
    from?: string;
    head?: Record<string, unknown>;
    content?: unknown;
    _status?: number;
  }

  /**
   * Serialized topic for storage.
   */
  export interface StoredTopic {
    name: string;
    created?: string;
    updated?: string;
    deleted?: string;
    touched?: string;
    read?: number;
    recv?: number;
    seq?: number;
    clear?: number;
    defacs?: DefAcs;
    creds?: Credential[];
    public?: Record<string, unknown>;
    trusted?: Record<string, unknown>;
    private?: Record<string, unknown>;
    _aux?: Record<string, unknown>;
    _deleted?: boolean;
    tags?: string[];
    acs?: { given?: string; want?: string; mode?: string };
  }

  /**
   * Serialized subscription for storage.
   */
  export interface StoredSubscription {
    topic: string;
    uid: string;
    updated?: string;
    mode?: string;
    read?: number;
    recv?: number;
    clear?: number;
    lastSeen?: { when?: string; ua?: string };
    userAgent?: string;
  }

  /**
   * Storage interface - exactly matches the DB class API.
   * Implementations: DB (IndexedDB, default), SQLiteStorage (React Native)
   */
  export interface Storage {
    // Database lifecycle
    /**
     * Initialize persistent cache: open or create/upgrade if needed.
     * @returns Promise resolved/rejected when the DB is initialized.
     */
    initDatabase(): Promise<IDBDatabase | unknown>;

    /**
     * Delete persistent cache.
     * @returns Promise resolved/rejected on operation completion.
     */
    deleteDatabase(): Promise<boolean>;

    /**
     * Check if persistent cache is ready for use.
     * @returns true if cache is ready, false otherwise.
     */
    isReady(): boolean;

    // Topics
    /**
     * Save to cache or update topic in persistent cache.
     * @param topic - topic to be added or updated.
     * @returns Promise resolved/rejected on operation completion.
     */
    updTopic(topic: Topic | StoredTopic): Promise<void>;

    /**
     * Mark or unmark topic as deleted.
     * @param name - name of the topic to mark or unmark.
     * @param deleted - status
     * @returns Promise resolved/rejected on operation completion.
     */
    markTopicAsDeleted(name: string, deleted: boolean): Promise<void>;

    /**
     * Remove topic from persistent cache.
     * @param name - name of the topic to remove from database.
     * @returns Promise resolved/rejected on operation completion.
     */
    remTopic(name: string): Promise<void>;

    /**
     * Execute a callback for each stored topic.
     * @param callback - function to call for each topic.
     * @param context - the value of 'this' inside the callback.
     * @returns Promise resolved/rejected on operation completion.
     */
    mapTopics(callback?: (topic: StoredTopic) => void, context?: unknown): Promise<StoredTopic[]>;

    /**
     * Copy data from serialized object to topic.
     * @param topic - target to deserialize to.
     * @param src - serialized data to copy from.
     */
    deserializeTopic(topic: Topic, src: StoredTopic): void;

    // Users
    /**
     * Add or update user object in the persistent cache.
     * @param uid - ID of the user to save or update.
     * @param pub - user's public information.
     * @returns Promise resolved/rejected on operation completion.
     */
    updUser(uid: string, pub: Record<string, unknown>): Promise<void>;

    /**
     * Remove user from persistent cache.
     * @param uid - ID of the user to remove from the cache.
     * @returns Promise resolved/rejected on operation completion.
     */
    remUser(uid: string): Promise<void>;

    /**
     * Execute a callback for each stored user.
     * @param callback - function to call for each user.
     * @param context - the value of 'this' inside the callback.
     * @returns Promise resolved/rejected on operation completion.
     */
    mapUsers(callback?: (user: CachedUser) => void, context?: unknown): Promise<CachedUser[]>;

    /**
     * Read a single user from persistent cache.
     * @param uid - ID of the user to fetch from cache.
     * @returns Promise resolved/rejected on operation completion.
     */
    getUser(uid: string): Promise<CachedUser | undefined>;

    // Subscriptions
    /**
     * Add or update subscription in persistent cache.
     * @param topicName - name of the topic which owns the subscription.
     * @param uid - ID of the subscribed user.
     * @param sub - subscription to save.
     * @returns Promise resolved/rejected on operation completion.
     */
    updSubscription(topicName: string, uid: string, sub: TopicSubscription | StoredSubscription): Promise<void>;

    /**
     * Execute a callback for each cached subscription in a given topic.
     * @param topicName - name of the topic which owns the subscriptions.
     * @param callback - function to call for each subscription.
     * @param context - the value of 'this' inside the callback.
     * @returns Promise resolved/rejected on operation completion.
     */
    mapSubscriptions(topicName: string, callback?: (sub: StoredSubscription) => void, context?: unknown): Promise<StoredSubscription[]>;

    // Messages
    /**
     * Save message to persistent cache.
     * @param msg - message to save.
     * @returns Promise resolved/rejected on operation completion.
     */
    addMessage(msg: ServerMessage | StoredMessage): Promise<void>;

    /**
     * Update delivery status of a message stored in persistent cache.
     * @param topicName - name of the topic which owns the message.
     * @param seq - ID of the message to update.
     * @param status - new delivery status of the message.
     * @returns Promise resolved/rejected on operation completion.
     */
    updMessageStatus(topicName: string, seq: number, status: number): Promise<void>;

    /**
     * Remove one or more messages from persistent cache.
     * @param topicName - name of the topic which owns the message.
     * @param from - id of the message to remove or lower boundary when removing range (inclusive).
     * @param to - upper boundary (exclusive) when removing a range of messages.
     * @returns Promise resolved/rejected on operation completion.
     */
    remMessages(topicName: string, from?: number, to?: number): Promise<void>;

    /**
     * Retrieve messages from persistent store.
     * @param topicName - name of the topic to retrieve messages from.
     * @param query - parameters of the message range to retrieve.
     * @param callback - function to call for each retrieved message.
     * @param context - the value of 'this' inside the callback.
     * @returns Promise resolved/rejected on operation completion.
     */
    readMessages(topicName: string, query: GetDataType, callback?: (msg: StoredMessage | StoredMessage[]) => void, context?: unknown): Promise<StoredMessage[]>;

    // Deletion Log
    /**
     * Add records of deleted messages.
     * @param topicName - name of the topic which owns the message.
     * @param delId - id of the deletion transaction.
     * @param ranges - array of deleted message ranges.
     * @returns Promise resolved/rejected on operation completion.
     */
    addDelLog(topicName: string, delId: number, ranges: IdRange[]): Promise<void>;

    /**
     * Retrieve deleted message records from persistent store.
     * @param topicName - name of the topic to retrieve records for.
     * @param query - parameters of the range to retrieve.
     * @returns Promise resolved/rejected on operation completion.
     */
    readDelLog(topicName: string, query: GetDataType): Promise<IdRange[]>;

    /**
     * Retrieve the latest 'clear' ID for the given topic.
     * @param topicName - name of the topic.
     * @returns Promise resolved/rejected on operation completion.
     */
    maxDelId(topicName: string): Promise<DelLogEntry | undefined>;
  }

  /**
   * DB class - IndexedDB storage implementation (default).
   * This is the default storage backend used by Tinode on web platforms.
   */
  export class DB implements Storage {
    /** Indicator that the cache is disabled */
    disabled: boolean;
    /** Instance of IndexDB */
    db: IDBDatabase | null;

    /**
     * Create a new DB instance.
     * @param onError - callback for database errors.
     * @param logger - logging function.
     */
    constructor(onError?: (err: Error) => void, logger?: (component: string, event: string, ...args: unknown[]) => void);

    /**
     * To use DB in a non-browser context, supply indexedDB provider.
     * @param idbProvider - indexedDB provider, e.g. for node: require('fake-indexeddb')
     */
    static setDatabaseProvider(idbProvider: IDBFactory): void;

    // Storage interface implementation
    initDatabase(): Promise<IDBDatabase>;
    deleteDatabase(): Promise<boolean>;
    isReady(): boolean;
    updTopic(topic: Topic | StoredTopic): Promise<void>;
    markTopicAsDeleted(name: string, deleted: boolean): Promise<void>;
    remTopic(name: string): Promise<void>;
    mapTopics(callback?: (topic: StoredTopic) => void, context?: unknown): Promise<StoredTopic[]>;
    deserializeTopic(topic: Topic, src: StoredTopic): void;
    updUser(uid: string, pub: Record<string, unknown>): Promise<void>;
    remUser(uid: string): Promise<void>;
    mapUsers(callback?: (user: CachedUser) => void, context?: unknown): Promise<CachedUser[]>;
    getUser(uid: string): Promise<CachedUser | undefined>;
    updSubscription(topicName: string, uid: string, sub: TopicSubscription | StoredSubscription): Promise<void>;
    mapSubscriptions(topicName: string, callback?: (sub: StoredSubscription) => void, context?: unknown): Promise<StoredSubscription[]>;
    addMessage(msg: ServerMessage | StoredMessage): Promise<void>;
    updMessageStatus(topicName: string, seq: number, status: number): Promise<void>;
    remMessages(topicName: string, from?: number, to?: number): Promise<void>;
    readMessages(topicName: string, query: GetDataType, callback?: (msg: StoredMessage | StoredMessage[]) => void, context?: unknown): Promise<StoredMessage[]>;
    addDelLog(topicName: string, delId: number, ranges: IdRange[]): Promise<void>;
    readDelLog(topicName: string, query: GetDataType): Promise<IdRange[]>;
    maxDelId(topicName: string): Promise<DelLogEntry | undefined>;
  }

  /**
   * SQLite storage implementation for React Native.
   * Drop-in replacement for DB class using expo-sqlite for true persistence.
   */
  export class SQLiteStorage implements Storage {
    /**
     * Create a new SQLiteStorage instance.
     * @param dbName - database file name (default: 'tinode.db').
     * @param onError - callback for database errors.
     * @param logger - logging function.
     */
    constructor(dbName?: string, onError?: (err: Error) => void, logger?: (component: string, event: string, ...args: unknown[]) => void);

    // Storage interface implementation
    initDatabase(): Promise<unknown>;
    deleteDatabase(): Promise<boolean>;
    isReady(): boolean;
    updTopic(topic: Topic | StoredTopic): Promise<void>;
    markTopicAsDeleted(name: string, deleted: boolean): Promise<void>;
    remTopic(name: string): Promise<void>;
    mapTopics(callback?: (topic: StoredTopic) => void, context?: unknown): Promise<StoredTopic[]>;
    deserializeTopic(topic: Topic, src: StoredTopic): void;
    updUser(uid: string, pub: Record<string, unknown>): Promise<void>;
    remUser(uid: string): Promise<void>;
    mapUsers(callback?: (user: CachedUser) => void, context?: unknown): Promise<CachedUser[]>;
    getUser(uid: string): Promise<CachedUser | undefined>;
    updSubscription(topicName: string, uid: string, sub: TopicSubscription | StoredSubscription): Promise<void>;
    mapSubscriptions(topicName: string, callback?: (sub: StoredSubscription) => void, context?: unknown): Promise<StoredSubscription[]>;
    addMessage(msg: ServerMessage | StoredMessage): Promise<void>;
    updMessageStatus(topicName: string, seq: number, status: number): Promise<void>;
    remMessages(topicName: string, from?: number, to?: number): Promise<void>;
    readMessages(topicName: string, query: GetDataType, callback?: (msg: StoredMessage | StoredMessage[]) => void, context?: unknown): Promise<StoredMessage[]>;
    addDelLog(topicName: string, delId: number, ranges: IdRange[]): Promise<void>;
    readDelLog(topicName: string, query: GetDataType): Promise<IdRange[]>;
    maxDelId(topicName: string): Promise<DelLogEntry | undefined>;
  }

  // Also export as default for backwards compatibility
  export default Tinode;
}
