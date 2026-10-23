/*
* (c) Проект "Core.As", Александр Орефков orefkov@gmail.com
* Различные константы для сетевой работы
*/

/**< (VH) Don't allow the connection unless the client has a
 * client cert that we recognize; provides
 * LWS_SERVER_OPTION_DO_SSL_GLOBAL_INIT */
const uint64 LWS_SERVER_OPTION_REQUIRE_VALID_OPENSSL_CLIENT_CERT = (1 << 1) | (1 << 12);

/**< (CTX) Don't try to get the server's hostname */
const uint64 LWS_SERVER_OPTION_SKIP_SERVER_CANONICAL_NAME = 1 << 2;

/**< (VH) Allow non-SSL (plaintext) connections on the same
 * port as SSL is listening.  If combined with
 * LWS_SERVER_OPTION_REDIRECT_HTTP_TO_HTTPS it will try to
 * force http connections on an https listener (eg, http://x.com:443) to
 * redirect to an explicit https connection (eg, https://x.com)
 */
const uint64 LWS_SERVER_OPTION_ALLOW_NON_SSL_ON_SSL_PORT = (1 << 3) | (1 << 12);

/**< (VH) Disable IPV6 support */
const uint64 LWS_SERVER_OPTION_DISABLE_IPV6 = 1 << 5;

/**< (VH) if set, only ipv6 allowed on the vhost */
const uint64 LWS_SERVER_OPTION_IPV6_V6ONLY_VALUE = 1 << 17;

/**< (VH) Accept connections with no valid Cert (eg, selfsigned) */
const uint64 LWS_SERVER_OPTION_PEER_CERT_NOT_REQUIRED = 1 << 7;

/**< (VH) Check UT-8 correctness */
const uint64 LWS_SERVER_OPTION_VALIDATE_UTF8 = 1 << 8;

/**< (VH)  initialize ECDH ciphers */
const uint64 LWS_SERVER_OPTION_SSL_ECDH = (1 << 9) | (1 << 12);

/**< (CTX) Initialize the SSL library at all */
const uint64 LWS_SERVER_OPTION_DO_SSL_GLOBAL_INIT = 1 << 12;

/**< (VH) Send Strict Transport Security header, making
 * clients subsequently go to https even if user asked for http */
const uint64 LWS_SERVER_OPTION_STS = 1 << 15;

const uint64 LWS_SERVER_OPTION_ONLY_RAW = 1 << 22;

/**< (VH) Don't fail if the vhost TLS cert or key are missing, just
 * continue.  The vhost won't be able to serve anything, but if for
 * example the ACME plugin was configured to fetch a cert, this lets
 * you bootstrap your vhost from having no cert to start with.
 */
const uint64 LWS_SERVER_OPTION_IGNORE_MISSING_CERT = 1 << 26;

/**< (VH) Send lws default HTTP headers recommended by Mozilla
 * Observatory for security.  This is a helper option that sends canned
 * headers on each http response enabling a VERY strict Content Security
 * Policy.  The policy is so strict, for example it won't let the page
 * run its own inline JS nor show images or take CSS from a different
 * server.  In many cases your JS only comes from your server as do the
 * image sources and CSS, so that is what you want... attackers hoping
 * to inject JS into your DOM are completely out of luck since even if
 * they succeed, it will be rejected for execution by the browser
 * according to the strict CSP.  In other cases you have to deviate from
 * the complete strictness, in which case don't use this flag: use the
 * .headers member in the vhost init described in struct
 * lws_context_creation_info instead to send the adapted headers
 * yourself.
 */
const uint64 LWS_SERVER_OPTION_HTTP_HEADERS_SECURITY_BEST_PRACTICES_ENFORCE = 1 << 28;

const uint LWSMPRO_HTTP = 0;        /**< http reverse proxy */
const uint LWSMPRO_HTTPS = 1;       /**< https reverse proxy */
const uint LWSMPRO_FILE = 2;        /**< serve from filesystem directory */
//const uint LWSMPRO_CGI = 3;         /**< pass to CGI to handle */
const uint LWSMPRO_REDIR_HTTP = 4;  /**< redirect to http:// url */
const uint LWSMPRO_REDIR_HTTPS = 5; /**< redirect to https:// url */
const uint LWSMPRO_CALLBACK = 6;    /**< hand by named protocol's callback */

enum HttpVerbs {
    httpGet,
    httpPost,
    httpOptions,
    httpPut,
    httpPatch,
    httpDelete,
    httpConnect,
    httpHead,
};

enum HttpHeaders {
    WSI_TOKEN_GET_URI, /* 0 */
    WSI_TOKEN_POST_URI,
    WSI_TOKEN_OPTIONS_URI,
    WSI_TOKEN_HOST,
    WSI_TOKEN_CONNECTION,
    WSI_TOKEN_UPGRADE, /* 5 */
    WSI_TOKEN_ORIGIN,
    WSI_TOKEN_DRAFT,
    WSI_TOKEN_CHALLENGE,
    WSI_TOKEN_EXTENSIONS,
    WSI_TOKEN_KEY1, /* 10 */
    WSI_TOKEN_KEY2,
    WSI_TOKEN_PROTOCOL,
    WSI_TOKEN_ACCEPT,
    WSI_TOKEN_NONCE,
    WSI_TOKEN_HTTP,
    WSI_TOKEN_HTTP2_SETTINGS, /* 16 */
    WSI_TOKEN_HTTP_ACCEPT,
    WSI_TOKEN_HTTP_AC_REQUEST_HEADERS,
    WSI_TOKEN_HTTP_IF_MODIFIED_SINCE,
    WSI_TOKEN_HTTP_IF_NONE_MATCH, /* 20 */
    WSI_TOKEN_HTTP_ACCEPT_ENCODING,
    WSI_TOKEN_HTTP_ACCEPT_LANGUAGE,
    WSI_TOKEN_HTTP_PRAGMA,
    WSI_TOKEN_HTTP_CACHE_CONTROL,
    WSI_TOKEN_HTTP_AUTHORIZATION,
    WSI_TOKEN_HTTP_COOKIE,
    WSI_TOKEN_HTTP_CONTENT_LENGTH, /* 27 */
    WSI_TOKEN_HTTP_CONTENT_TYPE,
    WSI_TOKEN_HTTP_DATE,
    WSI_TOKEN_HTTP_RANGE,
    WSI_TOKEN_HTTP_REFERER,
    WSI_TOKEN_KEY,
    WSI_TOKEN_VERSION,
    WSI_TOKEN_SWORIGIN,
    WSI_TOKEN_HTTP_COLON_AUTHORITY,
    WSI_TOKEN_HTTP_COLON_METHOD,
    WSI_TOKEN_HTTP_COLON_PATH,
    WSI_TOKEN_HTTP_COLON_SCHEME,
    WSI_TOKEN_HTTP_COLON_STATUS,
    WSI_TOKEN_HTTP_ACCEPT_CHARSET,
    WSI_TOKEN_HTTP_ACCEPT_RANGES,
    WSI_TOKEN_HTTP_ACCESS_CONTROL_ALLOW_ORIGIN,
    WSI_TOKEN_HTTP_AGE,
    WSI_TOKEN_HTTP_ALLOW,
    WSI_TOKEN_HTTP_CONTENT_DISPOSITION,
    WSI_TOKEN_HTTP_CONTENT_ENCODING,
    WSI_TOKEN_HTTP_CONTENT_LANGUAGE,
    WSI_TOKEN_HTTP_CONTENT_LOCATION,
    WSI_TOKEN_HTTP_CONTENT_RANGE,
    WSI_TOKEN_HTTP_ETAG,
    WSI_TOKEN_HTTP_EXPECT,
    WSI_TOKEN_HTTP_EXPIRES,
    WSI_TOKEN_HTTP_FROM,
    WSI_TOKEN_HTTP_IF_MATCH,
    WSI_TOKEN_HTTP_IF_RANGE,
    WSI_TOKEN_HTTP_IF_UNMODIFIED_SINCE,
    WSI_TOKEN_HTTP_LAST_MODIFIED,
    WSI_TOKEN_HTTP_LINK,
    WSI_TOKEN_HTTP_LOCATION,
    WSI_TOKEN_HTTP_MAX_FORWARDS,
    WSI_TOKEN_HTTP_PROXY_AUTHENTICATE,
    WSI_TOKEN_HTTP_PROXY_AUTHORIZATION,
    WSI_TOKEN_HTTP_REFRESH,
    WSI_TOKEN_HTTP_RETRY_AFTER,
    WSI_TOKEN_HTTP_SERVER,
    WSI_TOKEN_HTTP_SET_COOKIE,
    WSI_TOKEN_HTTP_STRICT_TRANSPORT_SECURITY,
    WSI_TOKEN_HTTP_TRANSFER_ENCODING,
    WSI_TOKEN_HTTP_USER_AGENT,
    WSI_TOKEN_HTTP_VARY,
    WSI_TOKEN_HTTP_VIA,
    WSI_TOKEN_HTTP_WWW_AUTHENTICATE,
    WSI_TOKEN_PATCH_URI,
    WSI_TOKEN_PUT_URI,
    WSI_TOKEN_DELETE_URI,
    WSI_TOKEN_HTTP_URI_ARGS,
    WSI_TOKEN_PROXY,
    WSI_TOKEN_HTTP_X_REAL_IP,
    WSI_TOKEN_HTTP1_0,
    WSI_TOKEN_X_FORWARDED_FOR,
    WSI_TOKEN_CONNECT,
    WSI_TOKEN_HEAD_URI,
    WSI_TOKEN_TE,
    WSI_TOKEN_REPLAY_NONCE, /* ACME */
    WSI_TOKEN_COLON_PROTOCOL,
    WSI_TOKEN_X_AUTH_TOKEN,
    WSI_TOKEN_DSS_SIGNATURE,
     _WSI_TOKEN_CLIENT_SENT_PROTOCOLS,
     _WSI_TOKEN_CLIENT_PEER_ADDRESS,
     _WSI_TOKEN_CLIENT_URI,
     _WSI_TOKEN_CLIENT_HOST,
     _WSI_TOKEN_CLIENT_ORIGIN,
     _WSI_TOKEN_CLIENT_METHOD,
     _WSI_TOKEN_CLIENT_IFACE,
     _WSI_TOKEN_CLIENT_ALPN,
     WSI_TOKEN_COUNT,
};

void getUriArgs(const HttpRequest& hc, NoCaseMap<string>& res) {
    array<string>&& a = hc.header(WSI_TOKEN_HTTP_URI_ARGS).split("&");
    for (uint i = 0; i < a.length; i++) {
        uint eqPos = a[i].find('=');
        if (eqPos == uint(-1))
            res.insert(a[i].urlDecode(), "");
        else
            res.insert(a[i].substr(0, eqPos).urlDecode(), a[i].substr(eqPos + 1).urlDecode());
    }
}
