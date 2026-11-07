using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Management;
using System.Net;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using System.Runtime.InteropServices;
using System.Numerics;
using Microsoft.Win32;

namespace NavBrahmi.Setup
{
    public class SetupConfig
    {
        public string LicenseKey { get; set; }
        public string AuthToken { get; set; }
        public string BackendUrl { get; set; }
        public string MachineOverride { get; set; }
        public bool Silent { get; set; }
        public bool AutoDetected { get; set; }

        public SetupConfig()
        {
            LicenseKey = "";
            AuthToken = "";
            BackendUrl = "http://localhost:3000";
            MachineOverride = "";
            Silent = false;
            AutoDetected = false;
        }
    }

    public class InstallerEngine
    {
        private SetupConfig _config;
        private Action<string> _logCallback;
        private Action<int, string> _progressCallback;

        public InstallerEngine(SetupConfig config, Action<string> logCallback, Action<int, string> progressCallback)
        {
            _config = config;
            _logCallback = logCallback ?? ((s) => { });
            _progressCallback = progressCallback ?? ((p, s) => { });
        }

        private void Log(string message)
        {
            _logCallback(message);
        }

        private void Progress(int percentage, string status)
        {
            _progressCallback(percentage, status);
        }

        public static bool IsAdministrator()
        {
            try
            {
                using (WindowsIdentity identity = WindowsIdentity.GetCurrent())
                {
                    WindowsPrincipal principal = new WindowsPrincipal(identity);
                    return principal.IsInRole(WindowsBuiltInRole.Administrator);
                }
            }
            catch
            {
                return false;
            }
        }

        public static bool TryDetectEmbeddedPayload(string exePath, out string detectedKey, out string detectedToken)
        {
            detectedKey = "";
            detectedToken = "";
            try
            {
                if (!File.Exists(exePath)) return false;
                using (FileStream fs = new FileStream(exePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                {
                    if (fs.Length < 100) return false;
                    long readLength = Math.Min(fs.Length, 65536);
                    fs.Seek(fs.Length - readLength, SeekOrigin.Begin);
                    byte[] buf = new byte[readLength];
                    int read = fs.Read(buf, 0, (int)readLength);
                    string tail = Encoding.UTF8.GetString(buf, 0, read);

                    string startTag = "---NAV_BRAHMI_AUTH_START---";
                    string endTag = "---NAV_BRAHMI_AUTH_END---";
                    int sIdx = tail.LastIndexOf(startTag);
                    int eIdx = tail.LastIndexOf(endTag);

                    if (sIdx >= 0 && eIdx > sIdx)
                    {
                        int jsonStart = sIdx + startTag.Length;
                        string jsonStr = tail.Substring(jsonStart, eIdx - jsonStart).Trim();

                        int lkIdx = jsonStr.IndexOf("\"licenseKey\":\"");
                        if (lkIdx >= 0)
                        {
                            int start = lkIdx + 14;
                            int end = jsonStr.IndexOf("\"", start);
                            if (end > start) detectedKey = jsonStr.Substring(start, end - start);
                        }

                        int tokIdx = jsonStr.IndexOf("\"token\":\"");
                        if (tokIdx >= 0)
                        {
                            int start = tokIdx + 9;
                            int end = jsonStr.IndexOf("\"", start);
                            if (end > start) detectedToken = jsonStr.Substring(start, end - start);
                        }

                        return !string.IsNullOrEmpty(detectedKey) || !string.IsNullOrEmpty(detectedToken);
                    }
                }
            }
            catch { }
            return false;
        }

        public string GetWindowsMachineIdentity(string overrideId)
        {
            if (!string.IsNullOrEmpty(overrideId) && overrideId.Trim().Length > 0)
            {
                byte[] simBytes = Encoding.UTF8.GetBytes("DEMO_SIMULATED_WINDOWS_MACHINE:" + overrideId.Trim());
                using (SHA256 sha = SHA256.Create())
                {
                    byte[] hashBytes = sha.ComputeHash(simBytes);
                    StringBuilder sb = new StringBuilder();
                    foreach (byte b in hashBytes) sb.Append(b.ToString("x2"));
                    return sb.ToString();
                }
            }

            List<string> components = new List<string>();

            // 1. Registry MachineGuid
            try
            {
                using (RegistryKey key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Cryptography"))
                {
                    if (key != null)
                    {
                        object val = key.GetValue("MachineGuid");
                        if (val != null && !string.IsNullOrEmpty(val.ToString()))
                        {
                            components.Add("REG_GUID:" + val.ToString().Trim());
                        }
                    }
                }
            }
            catch { }

            // 2. WMI Win32_ComputerSystemProduct UUID
            try
            {
                using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT UUID FROM Win32_ComputerSystemProduct"))
                {
                    foreach (ManagementObject mo in searcher.Get())
                    {
                        object uuidVal = mo["UUID"];
                        if (uuidVal != null && !string.IsNullOrEmpty(uuidVal.ToString()))
                        {
                            components.Add("SYS_UUID:" + uuidVal.ToString().Trim());
                            break;
                        }
                    }
                }
            }
            catch { }

            if (components.Count == 0)
            {
                components.Add("FALLBACK_HOST:" + Environment.MachineName + "-" + Environment.GetEnvironmentVariable("PROCESSOR_ARCHITECTURE"));
            }

            string combined = string.Join("|", components.ToArray());
            byte[] bytes = Encoding.UTF8.GetBytes("WINDOWS_MACHINE:" + combined);
            using (SHA256 sha = SHA256.Create())
            {
                byte[] hashBytes = sha.ComputeHash(bytes);
                StringBuilder sb = new StringBuilder();
                foreach (byte b in hashBytes) sb.Append(b.ToString("x2"));
                return sb.ToString();
            }
        }

        // =========================================================================
        // Win32 Font Registration P/Invoke Declarations (Task 1 & docs/production/07)
        // Note: AddFontResourceExW with FR_PRIVATE is strictly forbidden because Windows
        // automatically unregisters process-private fonts upon process exit.
        // Persistent installation requires file copying to the fonts folder, registry
        // registration under ...\CurrentVersion\Fonts, AddFontResourceW, and WM_FONTCHANGE broadcast.
        // =========================================================================
        [DllImport("gdi32.dll", EntryPoint = "AddFontResourceW", SetLastError = true, CharSet = CharSet.Unicode)]
        private static extern int AddFontResource(string lpszFilename);

        [DllImport("gdi32.dll", EntryPoint = "RemoveFontResourceW", SetLastError = true, CharSet = CharSet.Unicode)]
        private static extern int RemoveFontResource(string lpszFilename);

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        private static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, UIntPtr wParam, IntPtr lParam, uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);

        private const int HWND_BROADCAST = 0xffff;
        private const uint WM_FONTCHANGE = 0x001D;
        private const uint SMTO_ABORTIFHUNG = 0x0002;

        // =========================================================================
        // Task 1 Explicit Font Allowlist (C-29)
        // Only install explicitly approved font files belonging to the selected product.
        // Never install other fonts by wildcard (*.ttf/*.otf), extension enumeration, or fallback.
        // =========================================================================
        public static readonly string[] ApprovedFontAllowlist = new string[]
        {
            "navbrahmi-regular.ttf",
            "navbrahmi-bold.ttf"
        };

        // Product-Specific Font Allowlist per confirmed client decision C-29
        public static readonly Dictionary<string, string[]> ProductApprovedFonts = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            { "kannada", new string[] { "NotoSansKannada-RegularNJ.ttf" } },
            { "KANNADA", new string[] { "NotoSansKannada-RegularNJ.ttf" } },
            { "tulu", new string[] { "Brahmi_Tulu_Tigalari_Refined_Regular-refined.ttf" } },
            { "TULU", new string[] { "Brahmi_Tulu_Tigalari_Refined_Regular-refined.ttf" } },
            { "ashokan-brahmi", new string[] { "NotoSansBrahmi-Regular.ttf" } },
            { "ASHOKAN_BRAHMI", new string[] { "NotoSansBrahmi-Regular.ttf" } },
            { "bengali", new string[] { "NotoSansBengali-Regular.ttf", "NotoSansBengali-Bold.ttf" } },
            { "BENGALI", new string[] { "NotoSansBengali-Regular.ttf", "NotoSansBengali-Bold.ttf" } },
            { "devanagari-hindi", new string[] { "NotoSansDevanagari-Regular.ttf", "NotoSansDevanagari-Bold.ttf", "Gargi.ttf", "Lohit-Devanagari.ttf", "Chandas.ttf" } },
            { "DEVANAGARI_HINDI", new string[] { "NotoSansDevanagari-Regular.ttf", "NotoSansDevanagari-Bold.ttf", "Gargi.ttf", "Lohit-Devanagari.ttf", "Chandas.ttf" } },
            { "gujarati", new string[] { "NotoSansGujarati-Regular.ttf", "NotoSansGujarati-Bold.ttf" } },
            { "GUJARATI", new string[] { "NotoSansGujarati-Regular.ttf", "NotoSansGujarati-Bold.ttf" } },
            { "malayalam", new string[] { "NotoSansMalayalam-Regular.ttf", "NotoSansMalayalam-Bold.ttf", "RaghuMalayalamSans-Regular.ttf", "Rachana-Regular.ttf", "Keraleeyam-Regular.ttf", "Meera-Regular.ttf" } },
            { "MALAYALAM", new string[] { "NotoSansMalayalam-Regular.ttf", "NotoSansMalayalam-Bold.ttf", "RaghuMalayalamSans-Regular.ttf", "Rachana-Regular.ttf", "Keraleeyam-Regular.ttf", "Meera-Regular.ttf" } },
            { "modi-marathi", new string[] { "NotoSansModi-Regular.ttf" } },
            { "MODI_MARATHI", new string[] { "NotoSansModi-Regular.ttf" } },
            { "oriya-odia", new string[] { "NotoSansOriya-Regular.ttf", "NotoSansOriya-Bold.ttf" } },
            { "ORIYA_ODIA", new string[] { "NotoSansOriya-Regular.ttf", "NotoSansOriya-Bold.ttf" } },
            { "punjabi-gurmukhi", new string[] { "NotoSansGurmukhi-Regular.ttf", "NotoSansGurmukhi-Bold.ttf" } },
            { "PUNJABI_GURMUKHI", new string[] { "NotoSansGurmukhi-Regular.ttf", "NotoSansGurmukhi-Bold.ttf" } },
            { "tamil", new string[] { "NotoSansTamil-Regular.ttf", "NotoSansTamil-Bold.ttf" } },
            { "TAMIL", new string[] { "NotoSansTamil-Regular.ttf", "NotoSansTamil-Bold.ttf" } },
            { "tamil-grantha", new string[] { "NotoSansGrantha-Regular.ttf", "NotoSerifGrantha-Regular.ttf" } },
            { "TAMIL_GRANTHA", new string[] { "NotoSansGrantha-Regular.ttf", "NotoSerifGrantha-Regular.ttf" } },
            { "tamil-and-grantha", new string[] { "NotoSansTamil-Regular.ttf", "NotoSansTamil-Bold.ttf", "NotoSansGrantha-Regular.ttf", "NotoSerifGrantha-Regular.ttf" } },
            { "TAMIL_AND_GRANTHA", new string[] { "NotoSansTamil-Regular.ttf", "NotoSansTamil-Bold.ttf", "NotoSansGrantha-Regular.ttf", "NotoSerifGrantha-Regular.ttf" } },
            { "telugu", new string[] { "NotoSansTelugu-Regular.ttf", "NotoSansTelugu-Bold.ttf" } },
            { "TELUGU", new string[] { "NotoSansTelugu-Regular.ttf", "NotoSansTelugu-Bold.ttf" } },
            { "sharada", new string[] { "NotoSansSharada-Regular.ttf" } },
            { "SHARADA", new string[] { "NotoSansSharada-Regular.ttf" } }
        };

        // =========================================================================
        // Task 2 Canonical Ed25519 Token Verification & Key Rotation
        // Trusted verification public keys mapped by Key ID (kid).
        // Public verification keys ONLY (safe to embed in client binaries).
        // Server signing private keys are strictly NEVER embedded or present in the client.
        // =========================================================================
        public static readonly Dictionary<string, string> TrustedVerificationPublicKeys = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            // Production Key ID v1 (SPKI DER or 32 raw bytes Base64)
            { "nav-brahmi-ed25519-v1", "MCowBQYDK2VwAyEAx5s2b/O159L3G2+r6W6q1+tD7P4L8N7F3m2e1B5c6kA=" }
        };

        public class ActivationTokenClaims
        {
            public string TokenId { get; set; }        // tid / jti
            public string LicenseId { get; set; }      // lid / lic
            public string ProductId { get; set; }      // pid / prd
            public string MachineHash { get; set; }    // mch
            public long IssuedAt { get; set; }         // iat
            public long ExpiresAt { get; set; }        // exp
            public string KeyId { get; set; }          // kid
            public string Status { get; set; }
        }

        public static bool VerifyActivationTokenLocally(string token, string expectedMachineHash, out string error)
        {
            ActivationTokenClaims claims;
            return VerifyActivationTokenLocally(token, expectedMachineHash, null, out error, out claims);
        }

        public static bool VerifyActivationTokenLocally(
            string token,
            string expectedMachineHash,
            string expectedProductId,
            out string error,
            out ActivationTokenClaims claims)
        {
            error = "";
            claims = null;

            if (string.IsNullOrEmpty(token))
            {
                error = "Activation token is empty or null.";
                return false;
            }

            string[] parts = token.Trim().Split('.');
            if (parts.Length != 2)
            {
                error = "Malformed activation token structure. Expected <payload>.<signature>";
                return false;
            }

            try
            {
                // 1. Decode base64url signature (must be exactly 64 bytes for Ed25519)
                string sigB64 = parts[1].Replace('-', '+').Replace('_', '/');
                switch (sigB64.Length % 4)
                {
                    case 2: sigB64 += "=="; break;
                    case 3: sigB64 += "="; break;
                }
                byte[] sigBytes = Convert.FromBase64String(sigB64);
                if (sigBytes.Length != 64)
                {
                    error = string.Format("Invalid Ed25519 signature length: {0} bytes (expected 64).", sigBytes.Length);
                    return false;
                }

                // 2. Decode base64url payload
                string payloadB64 = parts[0].Replace('-', '+').Replace('_', '/');
                switch (payloadB64.Length % 4)
                {
                    case 2: payloadB64 += "=="; break;
                    case 3: payloadB64 += "="; break;
                }
                string jsonPayload = Encoding.UTF8.GetString(Convert.FromBase64String(payloadB64));

                // 3. Parse canonical claims
                claims = new ActivationTokenClaims();

                // Token ID (tid / jti)
                claims.TokenId = ExtractJsonString(jsonPayload, "tid") ?? ExtractJsonString(jsonPayload, "jti");
                if (string.IsNullOrEmpty(claims.TokenId))
                {
                    error = "Token payload is missing mandatory Token ID claim (tid / jti).";
                    return false;
                }

                // License ID (lid / lic / license_id)
                claims.LicenseId = ExtractJsonString(jsonPayload, "lid") ?? ExtractJsonString(jsonPayload, "lic") ?? ExtractJsonString(jsonPayload, "license_id");
                if (string.IsNullOrEmpty(claims.LicenseId))
                {
                    error = "Token payload is missing mandatory License ID claim (lid / lic).";
                    return false;
                }

                // Product ID (pid / prd / product_code)
                claims.ProductId = ExtractJsonString(jsonPayload, "pid") ?? ExtractJsonString(jsonPayload, "prd") ?? ExtractJsonString(jsonPayload, "product_code");
                if (string.IsNullOrEmpty(claims.ProductId))
                {
                    error = "Token payload is missing mandatory Product ID claim (pid / prd).";
                    return false;
                }

                // Machine Hash (mch / machine_id)
                claims.MachineHash = ExtractJsonString(jsonPayload, "mch") ?? ExtractJsonString(jsonPayload, "machine_id");
                if (string.IsNullOrEmpty(claims.MachineHash))
                {
                    error = "Token payload is missing mandatory Machine Hash claim (mch).";
                    return false;
                }

                // Key ID (kid)
                claims.KeyId = ExtractJsonString(jsonPayload, "kid") ?? "nav-brahmi-ed25519-v1";
                claims.Status = ExtractJsonString(jsonPayload, "status") ?? "ACTIVE";

                // Issued At (iat / issued_at)
                claims.IssuedAt = ExtractJsonLong(jsonPayload, "iat") ?? ExtractJsonLong(jsonPayload, "issued_at") ?? 0;

                // Expires At (exp / expires_at)
                long? expVal = ExtractJsonLong(jsonPayload, "exp") ?? ExtractJsonLong(jsonPayload, "expires_at");
                if (!expVal.HasValue)
                {
                    error = "Token payload is missing mandatory Expiry claim (exp).";
                    return false;
                }
                claims.ExpiresAt = expVal.Value;

                // 4. Validate Expiration
                long nowSec = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalSeconds;
                if (nowSec > claims.ExpiresAt)
                {
                    error = string.Format("Activation token has expired (now: {0}, exp: {1}).", nowSec, claims.ExpiresAt);
                    return false;
                }

                // 5. Validate Machine Binding
                if (!string.IsNullOrEmpty(expectedMachineHash) &&
                    !string.Equals(claims.MachineHash, expectedMachineHash, StringComparison.OrdinalIgnoreCase))
                {
                    error = "Token machine hash mismatch (bound to a different machine).";
                    return false;
                }

                // 6. Validate Product ID Match
                if (!string.IsNullOrEmpty(expectedProductId) &&
                    !string.Equals(claims.ProductId, expectedProductId, StringComparison.OrdinalIgnoreCase))
                {
                    error = string.Format("Token product ID mismatch (token for '{0}', expected '{1}').", claims.ProductId, expectedProductId);
                    return false;
                }

                // 7. Validate Key ID & Lookup Public Key
                string pubKeyString;
                if (!TrustedVerificationPublicKeys.TryGetValue(claims.KeyId, out pubKeyString) || string.IsNullOrEmpty(pubKeyString))
                {
                    error = string.Format("Token signed with unknown or untrusted Key ID: '{0}'.", claims.KeyId);
                    return false;
                }

                // 8. Cryptographic Ed25519 Signature Verification
                // Message signed is the UTF-8 bytes of parts[0] (<base64url_payload>)
                byte[] messageBytes = Encoding.UTF8.GetBytes(parts[0]);
                byte[] rawPublicKeyBytes = DecodeEd25519PublicKey(pubKeyString);

                bool isSigValid = Ed25519Verifier.Verify(rawPublicKeyBytes, messageBytes, sigBytes);
                if (!isSigValid)
                {
                    error = "Cryptographic Ed25519 signature verification failed. Token payload or signature has been altered.";
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                error = "Token verification parse exception: " + ex.Message;
                return false;
            }
        }

        private static string ExtractJsonString(string json, string key)
        {
            string needle = "\"" + key + "\":\"";
            int idx = json.IndexOf(needle, StringComparison.OrdinalIgnoreCase);
            if (idx < 0) return null;
            int start = idx + needle.Length;
            int end = json.IndexOf("\"", start);
            if (end > start)
            {
                return json.Substring(start, end - start);
            }
            return null;
        }

        private static long? ExtractJsonLong(string json, string key)
        {
            string needle = "\"" + key + "\":";
            int idx = json.IndexOf(needle, StringComparison.OrdinalIgnoreCase);
            if (idx < 0) return null;
            int start = idx + needle.Length;
            int end = json.IndexOfAny(new char[] { ',', '}', ' ', '\t', '\r', '\n' }, start);
            if (end < 0) end = json.Length;
            string valStr = json.Substring(start, end - start).Trim();
            long val;
            if (long.TryParse(valStr, out val))
            {
                return val;
            }
            return null;
        }

        private static byte[] DecodeEd25519PublicKey(string pubKeyStr)
        {
            string clean = pubKeyStr.Trim()
                .Replace("-----BEGIN PUBLIC KEY-----", "")
                .Replace("-----END PUBLIC KEY-----", "")
                .Replace("\r", "")
                .Replace("\n", "")
                .Trim();

            byte[] der = Convert.FromBase64String(clean);
            // SPKI DER format for Ed25519 has a 12-byte header: 30 2a 30 05 06 03 2b 65 70 03 21 00 followed by 32 raw bytes
            if (der.Length == 44)
            {
                byte[] raw = new byte[32];
                Array.Copy(der, 12, raw, 0, 32);
                return raw;
            }
            if (der.Length == 32)
            {
                return der;
            }
            throw new ArgumentException("Invalid Ed25519 public key length (expected 32 raw bytes or 44 SPKI DER bytes).");
        }

        // =========================================================================
        // Pure C# RFC 8032 Edwards25519 (Ed25519) Public Key Signature Verifier
        //
        // Self-contained, zero-dependency implementation compatible with .NET 4.0+.
        // Uses System.Numerics.BigInteger and System.Security.Cryptography.SHA512.
        //
        // Official Alternative with NuGet package (Task 2 Justification):
        // Package: BouncyCastle.Cryptography (v2.4.0+ maintained by Legion of the Bouncy Castle Inc.)
        // Compatible with: .NET Framework 4.6.1+, .NET Standard 2.0+, .NET 6/7/8/9.
        // BouncyCastle snippet:
        //   var validator = new Org.BouncyCastle.Crypto.Signers.Ed25519Signer();
        //   var pubParam = new Org.BouncyCastle.Crypto.Parameters.Ed25519PublicKeyParameters(pubKeyBytes, 0);
        //   validator.Init(false, pubParam);
        //   validator.BlockUpdate(messageBytes, 0, messageBytes.Length);
        //   bool ok = validator.VerifySignature(sigBytes);
        // =========================================================================
        public static class Ed25519Verifier
        {
            private static readonly BigInteger P = BigInteger.Parse("57896044618658097711785492504343953926634992332820282019728792003956564819949");
            private static readonly BigInteger L = BigInteger.Parse("7237005577332262213973186563042994240857116359379907606001950938285454250989");
            private static readonly BigInteger D = BigInteger.Parse("370957059344740094567083545501322941599805dec".Replace("dec", ""), System.Globalization.NumberStyles.HexNumber);
            private static readonly BigInteger Bx = BigInteger.Parse("0216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a", System.Globalization.NumberStyles.HexNumber);
            private static readonly BigInteger By = BigInteger.Parse("0666666666666666666666666666666666666666666666666666666666666658", System.Globalization.NumberStyles.HexNumber);
            private static readonly BigInteger I = BigInteger.Parse("02b8324804fc1df0b2b4d00993dfbd7a72f431806ad2fe478c4ee1b274a0ea0b0", System.Globalization.NumberStyles.HexNumber);

            private struct Point
            {
                public BigInteger X;
                public BigInteger Y;
                public Point(BigInteger x, BigInteger y) { X = x; Y = y; }
            }

            private static readonly Point BasePoint = new Point(Bx, By);
            private static readonly Point IdentityPoint = new Point(BigInteger.Zero, BigInteger.One);

            private static BigInteger Mod(BigInteger a, BigInteger m)
            {
                BigInteger r = a % m;
                return r < 0 ? r + m : r;
            }

            private static BigInteger ModInverse(BigInteger a, BigInteger m)
            {
                return BigInteger.ModPow(a, m - 2, m);
            }

            private static Point PointAdd(Point p1, Point p2)
            {
                BigInteger x1 = p1.X, y1 = p1.Y;
                BigInteger x2 = p2.X, y2 = p2.Y;

                BigInteger dxy = Mod(D * x1 * x2 * y1 * y2, P);
                BigInteger denomX = Mod(1 + dxy, P);
                BigInteger denomY = Mod(1 - dxy, P);

                BigInteger numerX = Mod(x1 * y2 + y1 * x2, P);
                BigInteger numerY = Mod(y1 * y2 + x1 * x2, P);

                BigInteger x3 = Mod(numerX * ModInverse(denomX, P), P);
                BigInteger y3 = Mod(numerY * ModInverse(denomY, P), P);

                return new Point(x3, y3);
            }

            private static Point ScalarMul(BigInteger s, Point p)
            {
                Point r = IdentityPoint;
                Point temp = p;
                while (s > 0)
                {
                    if ((s & 1) != 0)
                    {
                        r = PointAdd(r, temp);
                    }
                    temp = PointAdd(temp, temp);
                    s >>= 1;
                }
                return r;
            }

            private static bool TryDecodePoint(byte[] b, out Point pt)
            {
                pt = IdentityPoint;
                if (b == null || b.Length != 32) return false;

                byte[] yBytes = new byte[33];
                Array.Copy(b, yBytes, 32);
                yBytes[31] &= 0x7F; // clear sign bit
                BigInteger y = new BigInteger(yBytes);

                int sign = (b[31] >> 7) & 1;

                BigInteger u = Mod(y * y - 1, P);
                BigInteger v = Mod(D * y * y + 1, P);
                BigInteger x2 = Mod(u * ModInverse(v, P), P);

                BigInteger x = BigInteger.ModPow(x2, (P + 3) / 8, P);
                if (Mod(x * x, P) != x2)
                {
                    x = Mod(x * I, P);
                }
                if (Mod(x * x, P) != x2)
                {
                    return false;
                }

                if ((x % 2 != 0 ? 1 : 0) != sign)
                {
                    x = P - x;
                }

                pt = new Point(x, y);
                return true;
            }

            public static bool Verify(byte[] pubKey, byte[] message, byte[] signature)
            {
                if (pubKey == null || pubKey.Length != 32 ||
                    signature == null || signature.Length != 64 ||
                    message == null)
                {
                    return false;
                }

                byte[] rBytes = new byte[32];
                Array.Copy(signature, 0, rBytes, 0, 32);

                byte[] sBytes = new byte[33];
                Array.Copy(signature, 32, sBytes, 0, 32);
                BigInteger s = new BigInteger(sBytes);

                if (s >= L || s < 0) return false;

                Point aPoint;
                if (!TryDecodePoint(pubKey, out aPoint)) return false;

                Point rPoint;
                if (!TryDecodePoint(rBytes, out rPoint)) return false;

                // k = SHA512(R || A || M) mod L
                byte[] hashInput = new byte[32 + 32 + message.Length];
                Array.Copy(rBytes, 0, hashInput, 0, 32);
                Array.Copy(pubKey, 0, hashInput, 32, 32);
                Array.Copy(message, 0, hashInput, 64, message.Length);

                byte[] h;
                using (SHA512 sha512 = SHA512.Create())
                {
                    h = sha512.ComputeHash(hashInput);
                }

                byte[] hBytes = new byte[65];
                Array.Copy(h, hBytes, 64);
                BigInteger k = Mod(new BigInteger(hBytes), L);

                Point sb = ScalarMul(s, BasePoint);
                Point ka = ScalarMul(k, aPoint);
                Point rPlusKa = PointAdd(rPoint, ka);

                return sb.X == rPlusKa.X && sb.Y == rPlusKa.Y;
            }
        }

        public string ComputeFileSha256(string filePath)
        {
            using (FileStream fs = File.OpenRead(filePath))
            using (SHA256 sha = SHA256.Create())
            {
                byte[] hash = sha.ComputeHash(fs);
                StringBuilder sb = new StringBuilder();
                foreach (byte b in hash) sb.Append(b.ToString("x2"));
                return sb.ToString();
            }
        }

        public static bool AssertUrlSecurity(string url)
        {
            if (string.IsNullOrEmpty(url)) return false;
            Uri uri;
            if (!Uri.TryCreate(url, UriKind.Absolute, out uri)) return false;
            if (uri.Scheme.Equals("https", StringComparison.OrdinalIgnoreCase)) return true;
            if (uri.Scheme.Equals("http", StringComparison.OrdinalIgnoreCase) &&
                (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) || uri.Host.Equals("127.0.0.1")))
            {
                return true;
            }
            return false;
        }

        public static string DetectNativeArchitecture()
        {
            string arch = (Environment.GetEnvironmentVariable("PROCESSOR_ARCHITECTURE") ?? "").ToLower().Trim();
            string archW64 = (Environment.GetEnvironmentVariable("PROCESSOR_ARCHITEW6432") ?? "").ToLower().Trim();

            if (arch == "amd64" || archW64 == "amd64" || arch == "x64" || archW64 == "x64")
            {
                return "x64";
            }
            if (arch == "x86" && string.IsNullOrEmpty(archW64))
            {
                return "x86";
            }
            if (arch.Contains("arm") || archW64.Contains("arm"))
            {
                return "arm64";
            }
            if (arch.Contains("ia64") || archW64.Contains("ia64"))
            {
                return "ia64";
            }
            return arch;
        }

        private string HttpPost(string url, string jsonBody)
        {
            if (!AssertUrlSecurity(url))
            {
                throw new WebException("Insecure URL rejected by security policy. HTTPS is required for remote endpoints: " + url);
            }

            ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | (SecurityProtocolType)768 | SecurityProtocolType.Tls;
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = "POST";
            request.ContentType = "application/json";
            request.Timeout = 30000;

            byte[] bodyBytes = Encoding.UTF8.GetBytes(jsonBody);
            request.ContentLength = bodyBytes.Length;

            using (Stream reqStream = request.GetRequestStream())
            {
                reqStream.Write(bodyBytes, 0, bodyBytes.Length);
            }

            using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
            using (StreamReader reader = new StreamReader(response.GetResponseStream(), Encoding.UTF8))
            {
                return reader.ReadToEnd();
            }
        }

        public bool RunInstallation(out string errorMessage, out bool rebootRequired)
        {
            errorMessage = "";
            rebootRequired = false;
            bool isAdmin = IsAdministrator();

            string tempDir = Path.Combine(Path.GetTempPath(), "NavBrahmi_Setup_" + Guid.NewGuid().ToString("N").Substring(0, 8));

            try
            {
                Directory.CreateDirectory(tempDir);

                if (!AssertUrlSecurity(_config.BackendUrl))
                {
                    errorMessage = "Insecure backend URL configured. HTTPS is required for remote endpoints.";
                    Log("[ERROR] " + errorMessage);
                    return false;
                }

                // Native architecture detection (C-06 enforcement)
                string nativeArch = DetectNativeArchitecture();
                Log("Detected native processor architecture: " + nativeArch);

                if (nativeArch != "x64" && nativeArch != "x86")
                {
                    errorMessage = string.Format("Processor architecture '{0}' is not supported. Supported architectures are 64-bit (x64) and 32-bit (x86) (C-06).", nativeArch);
                    Log("[ERROR] " + errorMessage);
                    return false;
                }

                // If license key is empty but token is present, resolve token first
                if (string.IsNullOrEmpty(_config.LicenseKey) && !string.IsNullOrEmpty(_config.AuthToken))
                {
                    Progress(3, "Resolving purchase authorization token...");
                    string resolveUrl = _config.BackendUrl.TrimEnd('/') + "/api/license/resolve-token";
                    string resolveResp = HttpPost(resolveUrl, "{\"token\":\"" + _config.AuthToken.Trim() + "\"}");
                    int kIdx = resolveResp.IndexOf("\"license_key\":\"");
                    if (kIdx >= 0)
                    {
                        int start = kIdx + 15;
                        int end = resolveResp.IndexOf("\"", start);
                        if (end > start) _config.LicenseKey = resolveResp.Substring(start, end - start);
                    }
                }

                if (string.IsNullOrEmpty(_config.LicenseKey))
                {
                    errorMessage = "No valid license key provided or detected.";
                    Log("[ERROR] " + errorMessage);
                    return false;
                }

                Progress(5, "Deriving hardware machine identity...");
                string machineId = GetWindowsMachineIdentity(_config.MachineOverride);
                Log("Windows Machine Identity: " + machineId);

                Progress(15, "Validating license with backend...");
                string validateUrl = _config.BackendUrl.TrimEnd('/') + "/api/validate-license";
                string valReqJson = "{\"license_key\":\"" + _config.LicenseKey.Trim() + "\",\"platform\":\"WINDOWS\"}";
                string valRespJson;

                try
                {
                    valRespJson = HttpPost(validateUrl, valReqJson);
                }
                catch (WebException wex)
                {
                    string errDetail = wex.Message;
                    if (wex.Response != null)
                    {
                        using (StreamReader sr = new StreamReader(wex.Response.GetResponseStream()))
                        {
                            errDetail = sr.ReadToEnd();
                        }
                    }
                    errorMessage = "License validation failed: " + errDetail;
                    Log("[ERROR] " + errorMessage);
                    return false;
                }

                if (!valRespJson.Contains("\"valid\":true"))
                {
                    errorMessage = "License key is invalid, revoked, or expired.";
                    Log("[ERROR] " + errorMessage);
                    return false;
                }

                string productName = "Nav Brahmi Keyboard Driver";
                int prodIdx = valRespJson.IndexOf("\"product_name\":\"");
                if (prodIdx >= 0)
                {
                    int start = prodIdx + 16;
                    int end = valRespJson.IndexOf("\"", start);
                    if (end > start) productName = valRespJson.Substring(start, end - start);
                }

                string productCode = "NAV-BRAHMI-DRIVER";
                int codeIdx = valRespJson.IndexOf("\"product_code\":\"");
                if (codeIdx >= 0)
                {
                    int start = codeIdx + 16;
                    int end = valRespJson.IndexOf("\"", start);
                    if (end > start) productCode = valRespJson.Substring(start, end - start);
                }

                Log("License verified for product: " + productName);

                Progress(30, "Activating machine license...");
                string actUrl = _config.BackendUrl.TrimEnd('/') + "/api/activation";
                string actReqJson = "{\"license_key\":\"" + _config.LicenseKey.Trim() + "\",\"machine_id\":\"" + machineId + "\",\"product_code\":\"" + productCode + "\",\"platform\":\"WINDOWS\"}";
                string actRespJson;

                try
                {
                    actRespJson = HttpPost(actUrl, actReqJson);
                }
                catch (WebException wex)
                {
                    string errDetail = wex.Message;
                    if (wex.Response != null)
                    {
                        using (StreamReader sr = new StreamReader(wex.Response.GetResponseStream()))
                        {
                            errDetail = sr.ReadToEnd();
                        }
                    }
                    errorMessage = "Machine activation failed: " + errDetail;
                    Log("[ERROR] " + errorMessage);
                    return false;
                }

                if (!actRespJson.Contains("\"activated\":true"))
                {
                    errorMessage = "Machine activation was rejected by server.";
                    Log("[ERROR] " + errorMessage);
                    return false;
                }

                // Extract signed Ed25519 activation token
                string token = "";
                int tokenIdx = actRespJson.IndexOf("\"token\":\"");
                if (tokenIdx >= 0)
                {
                    int start = tokenIdx + 9;
                    int end = actRespJson.IndexOf("\"", start);
                    if (end > start) token = actRespJson.Substring(start, end - start);
                }

                if (string.IsNullOrEmpty(token))
                {
                    errorMessage = "Activation response did not include a valid signed activation token.";
                    Log("[ERROR] " + errorMessage);
                    return false;
                }

                // Local verification of Ed25519 activation token claims and structure
                string tokenVerificationError;
                if (!VerifyActivationTokenLocally(token, machineIdHash, out tokenVerificationError))
                {
                    errorMessage = "Local token verification failed: " + tokenVerificationError;
                    Log("[ERROR] " + errorMessage);
                    return false;
                }

                Log("Machine activation approved! Signed Ed25519 token verified locally.");

                // Save activation token locally
                try
                {
                    string targetDir = @"C:\Program Files\NavBrahmi";
                    if (!Directory.Exists(targetDir)) Directory.CreateDirectory(targetDir);
                    File.WriteAllText(Path.Combine(targetDir, "activation.token"), token, Encoding.UTF8);
                    Log("Saved activation token to C:\\Program Files\\NavBrahmi\\activation.token");
                }
                catch
                {
                    string userDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "NavBrahmi");
                    if (!Directory.Exists(userDir)) Directory.CreateDirectory(userDir);
                    File.WriteAllText(Path.Combine(userDir, "activation.token"), token, Encoding.UTF8);
                    Log("Saved activation token to " + Path.Combine(userDir, "activation.token"));
                }

                Progress(40, "Requesting authorized package download from secure Backblaze B2...");
                string pkgAuthUrl = _config.BackendUrl.TrimEnd('/') + "/api/package/authorize";
                string pkgAuthReqJson = "{\"token\":\"" + token + "\",\"machine_id\":\"" + machineId + "\",\"architecture\":\"" + nativeArch + "\"}";
                string pkgAuthRespJson;

                try
                {
                    pkgAuthRespJson = HttpPost(pkgAuthUrl, pkgAuthReqJson);
                }
                catch (WebException wex)
                {
                    string errDetail = wex.Message;
                    if (wex.Response != null)
                    {
                        using (StreamReader sr = new StreamReader(wex.Response.GetResponseStream()))
                        {
                            errDetail = sr.ReadToEnd();
                        }
                    }
                    errorMessage = "Package authorization failed: " + errDetail;
                    Log("[ERROR] " + errorMessage);
                    return false;
                }

                // Extract presigned Backblaze B2 download URL, expected SHA-256, and filename
                string downloadUrl = "";
                int urlIdx = pkgAuthRespJson.IndexOf("\"url\":\"");
                if (urlIdx >= 0)
                {
                    int start = urlIdx + 7;
                    int end = pkgAuthRespJson.IndexOf("\"", start);
                    if (end > start)
                    {
                        downloadUrl = pkgAuthRespJson.Substring(start, end - start).Replace("\\u0026", "&");
                    }
                }

                string expectedSha256 = "";
                int shaIdx = pkgAuthRespJson.IndexOf("\"sha256\":\"");
                if (shaIdx >= 0)
                {
                    int start = shaIdx + 10;
                    int end = pkgAuthRespJson.IndexOf("\"", start);
                    if (end > start) expectedSha256 = pkgAuthRespJson.Substring(start, end - start);
                }

                string filename = "driver-package.zip";
                int fnIdx = pkgAuthRespJson.IndexOf("\"fileName\":\"");
                if (fnIdx < 0) fnIdx = pkgAuthRespJson.IndexOf("\"filename\":\"");
                if (fnIdx >= 0)
                {
                    int start = fnIdx + (pkgAuthRespJson.Substring(fnIdx).StartsWith("\"fileName\":") ? 12 : 12);
                    int end = pkgAuthRespJson.IndexOf("\"", start);
                    if (end > start) filename = pkgAuthRespJson.Substring(start, end - start);
                }

                if (string.IsNullOrEmpty(downloadUrl))
                {
                    errorMessage = "Download URL not provided by package authorization endpoint.";
                    Log("[ERROR] " + errorMessage);
                    return false;
                }

                Progress(50, "Downloading driver package from secure Backblaze B2 storage...");
                string zipPath = Path.Combine(tempDir, filename);
                Log("Downloading package (" + filename + ")...");

                // Download with up to 3 retries with backoff
                bool downloadSuccess = false;
                for (int attempt = 1; attempt <= 3; attempt++)
                {
                    try
                    {
                        using (WebClient wc = new WebClient())
                        {
                            wc.DownloadFile(downloadUrl, zipPath);
                        }
                        downloadSuccess = true;
                        break;
                    }
                    catch (Exception dex)
                    {
                        Log(string.Format("[WARN] Download attempt {0} failed: {1}", attempt, dex.Message));
                        if (attempt < 3) Thread.Sleep(1000 * attempt);
                    }
                }

                if (!downloadSuccess || !File.Exists(zipPath))
                {
                    errorMessage = "Failed to download driver package after 3 attempts.";
                    Log("[ERROR] " + errorMessage);
                    return false;
                }

                Progress(65, "Verifying SHA-256 cryptographic checksum against authoritative server record...");
                string actualSha256 = ComputeFileSha256(zipPath);
                Log("Local SHA-256:    " + actualSha256);
                Log("Expected SHA-256: " + expectedSha256);

                if (!string.Equals(actualSha256, expectedSha256, StringComparison.OrdinalIgnoreCase))
                {
                    if (File.Exists(zipPath)) File.Delete(zipPath);
                    errorMessage = "SHA-256 Checksum Verification Failed! Package integrity compromised. File deleted.";
                    Log("[ERROR] " + errorMessage);
                    return false;
                }

                Log("Checksum verified successfully (" + actualSha256 + ").");

                Progress(75, "Extracting package contents...");
                string extractDir = Path.Combine(tempDir, "extracted");
                ZipFile.ExtractToDirectory(zipPath, extractDir);

                // Install Fonts (Only explicitly client-approved fonts under Task 1 & C-29)
                Progress(80, "Checking client-approved Unicode fonts (C-29 allowlist)...");
                // C-29: Font redistribution requires explicit client confirmation of font licenses.
                // Product-specific font manifest enforces that fonts are installed only for the matching product.
                // Do not install other fonts by wildcard (*.ttf/*.otf), extension enumeration, or automatic fallback.
                List<string> approvedFontsFound = new List<string>();
                HashSet<string> allowedNamesForProduct = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                // Add legacy allowlist for backwards compatibility
                foreach (string name in ApprovedFontAllowlist)
                {
                    allowedNamesForProduct.Add(name);
                }

                // Add product-specific approved fonts if product is identified from token claims
                if (claims != null && !string.IsNullOrEmpty(claims.ProductId) && ProductApprovedFonts.ContainsKey(claims.ProductId))
                {
                    foreach (string pFont in ProductApprovedFonts[claims.ProductId])
                    {
                        allowedNamesForProduct.Add(pFont);
                    }
                }

                foreach (string approvedName in allowedNamesForProduct)
                {
                    // Strict search for this exact approved filename only — NO wildcard (*.ttf/*.otf) enumeration
                    string[] matches = Directory.GetFiles(extractDir, approvedName, SearchOption.AllDirectories);
                    if (matches != null && matches.Length > 0)
                    {
                        approvedFontsFound.Add(matches[0]);
                    }
                }

                int installedFontsCount = 0;
                if (approvedFontsFound.Count == 0)
                {
                    Log("[INFO] No allowlisted fonts present in package for this product. Skipping font installation.");
                }
                else
                {
                    foreach (string fontFile in approvedFontsFound)
                    {
                        string fontName = Path.GetFileName(fontFile);
                        string fontTitle = (fontName.ToLower().Contains("bold") ? "NavBrahmi Bold" : "NavBrahmi Regular") + " (TrueType)";

                        Log("Installing approved font persistently: " + fontName);
                        try
                        {
                            if (isAdmin)
                            {
                                // Persistent System-wide installation
                                string sysFontsDir = Environment.GetFolderPath(Environment.SpecialFolder.Fonts);
                                if (string.IsNullOrEmpty(sysFontsDir) || !Directory.Exists(sysFontsDir))
                                {
                                    sysFontsDir = @"C:\Windows\Fonts";
                                }
                                string targetFontPath = Path.Combine(sysFontsDir, fontName);
                                File.Copy(fontFile, targetFontPath, true);

                                using (RegistryKey fontKey = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts", true))
                                {
                                    if (fontKey != null)
                                    {
                                        fontKey.SetValue(fontTitle, fontName);
                                    }
                                }

                                // Win32 API: Persistent addition without FR_PRIVATE (FR_PRIVATE is NOT used!)
                                int addResult = AddFontResource(targetFontPath);
                                Log(string.Format("Font registered system-wide: {0} (AddFontResource result: {1})", fontName, addResult));
                            }
                            else
                            {
                                // Persistent Per-User installation (Windows 10 1809+ / Windows 11)
                                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                                string userFontDir = Path.Combine(localAppData, @"Microsoft\Windows\Fonts");
                                if (!Directory.Exists(userFontDir))
                                {
                                    Directory.CreateDirectory(userFontDir);
                                }
                                string targetFontPath = Path.Combine(userFontDir, fontName);
                                File.Copy(fontFile, targetFontPath, true);

                                using (RegistryKey fontKey = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows NT\CurrentVersion\Fonts", true))
                                {
                                    if (fontKey != null)
                                    {
                                        // Per-user fonts require the full absolute path in registry
                                        fontKey.SetValue(fontTitle, targetFontPath);
                                    }
                                }

                                // Win32 API: Persistent addition without FR_PRIVATE
                                int addResult = AddFontResource(targetFontPath);
                                Log(string.Format("Font registered in user profile: {0} (AddFontResource result: {1})", fontName, addResult));
                            }
                            installedFontsCount++;
                        }
                        catch (Exception fe)
                        {
                            Log("[WARN] Font install notice for " + fontName + ": " + fe.Message);
                        }
                    }

                    if (installedFontsCount > 0)
                    {
                        // Broadcast WM_FONTCHANGE to notify all running desktop applications immediately
                        try
                        {
                            UIntPtr sendResult;
                            SendMessageTimeout((IntPtr)HWND_BROADCAST, WM_FONTCHANGE, UIntPtr.Zero, IntPtr.Zero, SMTO_ABORTIFHUNG, 1000, out sendResult);
                        }
                        catch (Exception bEx)
                        {
                            Log("[WARN] Broadcast WM_FONTCHANGE notice: " + bEx.Message);
                        }
                    }
                }
                Log("Approved font installation completed (" + installedFontsCount + " installed per explicit allowlist).");

                // Locate and execute architecture-matching MSI (Strict matching: no fallback to wrong architecture)
                Progress(85, "Installing keyboard layout driver MSI for architecture " + nativeArch + "...");
                string[] msiFiles = Directory.GetFiles(extractDir, "*.msi", SearchOption.AllDirectories);
                if (msiFiles.Length == 0)
                {
                    errorMessage = "No .msi installer found inside driver package.";
                    Log("[ERROR] " + errorMessage);
                    return false;
                }

                string targetMsi = null;
                foreach (string msi in msiFiles)
                {
                    string lowerMsi = Path.GetFileName(msi).ToLower();
                    if (nativeArch == "x64" && (lowerMsi.Contains("amd64") || lowerMsi.Contains("x64")))
                    {
                        targetMsi = msi;
                        break;
                    }
                    if (nativeArch == "x86" && (lowerMsi.Contains("i386") || lowerMsi.Contains("x86")))
                    {
                        targetMsi = msi;
                        break;
                    }
                }

                if (targetMsi == null)
                {
                    errorMessage = string.Format("Package does not contain an MSI for detected architecture '{0}'. Aborting to prevent installing incompatible binaries.", nativeArch);
                    Log("[ERROR] " + errorMessage);
                    return false;
                }

                Log("Selected architecture MSI: " + Path.GetFileName(targetMsi));
                string msiLog = Path.Combine(tempDir, "msi_install.log");

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "msiexec.exe";
                psi.Arguments = "/i \"" + targetMsi + "\" /qn /norestart /l*v \"" + msiLog + "\"";
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;

                Log("Executing msiexec.exe /i \"" + Path.GetFileName(targetMsi) + "\" /qn /norestart...");
                using (Process proc = Process.Start(psi))
                {
                    proc.WaitForExit();
                    int exitCode = proc.ExitCode;
                    Log("MSI Exit Code: " + exitCode);

                    if (exitCode == 0)
                    {
                        Log("Driver package installed successfully.");
                    }
                    else if (exitCode == 3010)
                    {
                        Log("Driver package installed successfully (system restart required).");
                        rebootRequired = true;
                    }
                    else if (exitCode == 1638)
                    {
                        Log("[INFO] MSI returned exit code 1638: Driver package may already be installed. Proceeding to verify layout registration...");
                    }
                    else if (exitCode == 1603 && !isAdmin)
                    {
                        errorMessage = "Administrator elevation required to register layout driver into System32 (Exit Code 1603).";
                        Log("[ERROR] " + errorMessage);
                        return false;
                    }
                    else
                    {
                        errorMessage = "Driver installation returned exit code " + exitCode + ".";
                        if (File.Exists(msiLog))
                        {
                            string logContent = File.ReadAllText(msiLog);
                            Log("[MSI LOG SNIPPET] " + logContent.Substring(Math.Max(0, logContent.Length - 1000)));
                        }
                        return false;
                    }
                }

                // Post-install verification check
                Progress(95, "Performing post-installation verification check...");
                bool layoutVerified = false;
                try
                {
                    using (RegistryKey klKey = Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Control\Keyboard Layouts"))
                    {
                        if (klKey != null)
                        {
                            foreach (string subKeyName in klKey.GetSubKeyNames())
                            {
                                using (RegistryKey subKey = klKey.OpenSubKey(subKeyName))
                                {
                                    if (subKey != null)
                                    {
                                        object layoutText = subKey.GetValue("Layout Text");
                                        if (layoutText != null && layoutText.ToString().ToLower().Contains("brahmi"))
                                        {
                                            layoutVerified = true;
                                            Log("Verified registered layout in registry: " + layoutText);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                catch { }

                if (!layoutVerified)
                {
                    errorMessage = "Post-installation layout verification failed: Keyboard layout is not registered in system registry. Installation cannot be confirmed.";
                    Log("[ERROR] " + errorMessage);
                    return false;
                }
                else
                {
                    Log("Post-installation verification passed: Keyboard layout is confirmed active in system registry.");
                }

                // Report telemetry to /api/activation/report
                try
                {
                    string reportUrl = _config.BackendUrl.TrimEnd('/') + "/api/activation/report";
                    string reportJson = "{\"token\":\"" + token + "\",\"machine_id\":\"" + machineId + "\",\"status\":\"SUCCESS\",\"reboot_required\":" + (rebootRequired ? "true" : "false") + "}";
                    HttpPost(reportUrl, reportJson);
                }
                catch { }

                Progress(100, "Installation completed successfully!");
                return true;
            }
            catch (Exception ex)
            {
                errorMessage = "Unexpected setup error: " + ex.Message;
                Log("[FATAL] " + errorMessage);
                return false;
            }
            finally
            {
                try
                {
                    if (Directory.Exists(tempDir))
                    {
                        Directory.Delete(tempDir, true);
                    }
                }
                catch { }
            }
        }
    }

    public class SetupForm : Form
    {
        private SetupConfig _config;
        private TextBox _txtLicense;
        private TextBox _txtBackend;
        private ProgressBar _progressBar;
        private Label _lblStatus;
        private Label _lblAutoBadge;
        private ListBox _lstLog;
        private Button _btnInstall;
        private Button _btnClose;
        private Label _lblHeaderTitle;
        private Label _lblHeaderSub;

        public SetupForm(SetupConfig config)
        {
            _config = config;
            InitializeComponents();
        }

        private void InitializeComponents()
        {
            this.Text = "Nav Brahmi Driver Installer";
            this.Size = new Size(580, 540);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(248, 249, 250);
            this.Font = new Font("Segoe UI", 9F, FontStyle.Regular);

            // Header Banner
            Panel headerPanel = new Panel();
            headerPanel.Dock = DockStyle.Top;
            headerPanel.Height = 85;
            headerPanel.BackColor = Color.FromArgb(15, 23, 42); // Dark slate

            _lblHeaderTitle = new Label();
            _lblHeaderTitle.Text = "⌨️ Nav Brahmi Driver Suite";
            _lblHeaderTitle.Font = new Font("Segoe UI", 14F, FontStyle.Bold);
            _lblHeaderTitle.ForeColor = Color.White;
            _lblHeaderTitle.Location = new Point(20, 16);
            _lblHeaderTitle.AutoSize = true;
            headerPanel.Controls.Add(_lblHeaderTitle);

            _lblHeaderSub = new Label();
            _lblHeaderSub.Text = "Licensed Windows 11 Keyboard Driver & Typography Bootstrapper";
            _lblHeaderSub.Font = new Font("Segoe UI", 9F, FontStyle.Regular);
            _lblHeaderSub.ForeColor = Color.FromArgb(148, 163, 184);
            _lblHeaderSub.Location = new Point(23, 48);
            _lblHeaderSub.AutoSize = true;
            headerPanel.Controls.Add(_lblHeaderSub);

            this.Controls.Add(headerPanel);

            // Main Body Controls
            int curY = 95;

            // Auto-Detection Banner
            if (_config.AutoDetected)
            {
                _lblAutoBadge = new Label();
                _lblAutoBadge.Text = "✓ License automatically verified from your authorized download";
                _lblAutoBadge.Location = new Point(25, curY);
                _lblAutoBadge.Size = new Size(515, 22);
                _lblAutoBadge.ForeColor = Color.FromArgb(22, 101, 52); // dark green
                _lblAutoBadge.BackColor = Color.FromArgb(220, 252, 231); // light green
                _lblAutoBadge.Font = new Font("Segoe UI", 8.5F, FontStyle.Bold);
                _lblAutoBadge.TextAlign = ContentAlignment.MiddleLeft;
                _lblAutoBadge.Padding = new Padding(6, 0, 0, 0);
                this.Controls.Add(_lblAutoBadge);
                curY += 28;
            }

            Label lblLic = new Label();
            lblLic.Text = "License Key (Auto-detected or manual entry):";
            lblLic.Location = new Point(25, curY);
            lblLic.AutoSize = true;
            lblLic.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            this.Controls.Add(lblLic);

            curY += 22;
            _txtLicense = new TextBox();
            _txtLicense.Location = new Point(25, curY);
            _txtLicense.Size = new Size(515, 26);
            _txtLicense.Font = new Font("Consolas", 10F, FontStyle.Bold);
            _txtLicense.Text = _config.LicenseKey;
            this.Controls.Add(_txtLicense);

            curY += 34;
            Label lblBack = new Label();
            lblBack.Text = "License Server Endpoint:";
            lblBack.Location = new Point(25, curY);
            lblBack.AutoSize = true;
            this.Controls.Add(lblBack);

            curY += 20;
            _txtBackend = new TextBox();
            _txtBackend.Location = new Point(25, curY);
            _txtBackend.Size = new Size(515, 24);
            _txtBackend.Text = _config.BackendUrl;
            this.Controls.Add(_txtBackend);

            curY += 32;
            _lblStatus = new Label();
            _lblStatus.Text = _config.AutoDetected
                ? "Authorized package ready. Click 'Install Driver' to begin."
                : "Enter or verify your license key, then click 'Install Driver'.";
            _lblStatus.Location = new Point(25, curY);
            _lblStatus.Size = new Size(515, 20);
            _lblStatus.ForeColor = Color.FromArgb(51, 65, 85);
            this.Controls.Add(_lblStatus);

            curY += 22;
            _progressBar = new ProgressBar();
            _progressBar.Location = new Point(25, curY);
            _progressBar.Size = new Size(515, 18);
            _progressBar.Minimum = 0;
            _progressBar.Maximum = 100;
            _progressBar.Value = 0;
            this.Controls.Add(_progressBar);

            curY += 26;
            _lstLog = new ListBox();
            _lstLog.Location = new Point(25, curY);
            _lstLog.Size = new Size(515, 110);
            _lstLog.Font = new Font("Consolas", 8.25F);
            _lstLog.BackColor = Color.FromArgb(241, 245, 249);
            this.Controls.Add(_lstLog);

            curY += 120;
            _btnInstall = new Button();
            _btnInstall.Text = "Install Driver";
            _btnInstall.Location = new Point(310, curY);
            _btnInstall.Size = new Size(130, 34);
            _btnInstall.BackColor = Color.FromArgb(37, 99, 235);
            _btnInstall.ForeColor = Color.White;
            _btnInstall.FlatStyle = FlatStyle.Flat;
            _btnInstall.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold);
            _btnInstall.Click += BtnInstall_Click;
            this.Controls.Add(_btnInstall);

            _btnClose = new Button();
            _btnClose.Text = "Cancel";
            _btnClose.Location = new Point(450, curY);
            _btnClose.Size = new Size(90, 34);
            _btnClose.BackColor = Color.FromArgb(226, 232, 240);
            _btnClose.FlatStyle = FlatStyle.Flat;
            _btnClose.Click += (s, e) => this.Close();
            this.Controls.Add(_btnClose);
        }

        private void AppendLog(string message)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action<string>(AppendLog), message);
                return;
            }
            _lstLog.Items.Add(message);
            _lstLog.TopIndex = _lstLog.Items.Count - 1;
        }

        private void SetProgress(int percent, string status)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action<int, string>(SetProgress), percent, status);
                return;
            }
            _progressBar.Value = Math.Max(0, Math.Min(100, percent));
            _lblStatus.Text = status;
        }

        private void BtnInstall_Click(object sender, EventArgs e)
        {
            string license = _txtLicense.Text.Trim();
            string backend = _txtBackend.Text.Trim();

            if (string.IsNullOrEmpty(license) && string.IsNullOrEmpty(_config.AuthToken))
            {
                MessageBox.Show("Please enter your Nav Brahmi license key or use an authorized installer.", "License Required", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            _config.LicenseKey = license;
            _config.BackendUrl = backend;

            _btnInstall.Enabled = false;
            _txtLicense.Enabled = false;
            _txtBackend.Enabled = false;
            _lstLog.Items.Clear();

            Thread worker = new Thread(() =>
            {
                InstallerEngine engine = new InstallerEngine(_config, AppendLog, SetProgress);
                string error;
                bool rebootRequired;
                bool success = engine.RunInstallation(out error, out rebootRequired);

                this.Invoke(new Action(() =>
                {
                    if (success)
                    {
                        if (rebootRequired)
                        {
                            MessageBox.Show("Nav Brahmi drivers installed successfully!\n\nPlease restart your Windows PC to finalize input method registration.", "Installation Complete", MessageBoxButtons.OK, MessageBoxIcon.Information);
                        }
                        else
                        {
                            MessageBox.Show("Nav Brahmi drivers installed and configured successfully!\n\nYou can now select the Brahmi / Tamil Grantha keyboard layout from the Windows Language Bar.", "Installation Complete", MessageBoxButtons.OK, MessageBoxIcon.Information);
                        }
                        this.Close();
                    }
                    else
                    {
                        _btnInstall.Enabled = true;
                        _txtLicense.Enabled = true;
                        _txtBackend.Enabled = true;
                        MessageBox.Show("Installation encountered an error:\n\n" + error + "\n\nFor help or license recovery, visit:\n" + _config.BackendUrl + "/recover", "Installation Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }));
            });

            worker.IsBackground = true;
            worker.Start();
        }
    }

    class Program
    {
        [System.Runtime.InteropServices.DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool AttachConsole(int dwProcessId);

        private const int ATTACH_PARENT_PROCESS = -1;

        [STAThread]
        static int Main(string[] args)
        {
            SetupConfig config = new SetupConfig();

            for (int i = 0; i < args.Length; i++)
            {
                string arg = args[i].Trim();
                if (arg.Equals("-LicenseKey", StringComparison.OrdinalIgnoreCase) || arg.Equals("-k", StringComparison.OrdinalIgnoreCase) || arg.Equals("/k", StringComparison.OrdinalIgnoreCase))
                {
                    if (i + 1 < args.Length) config.LicenseKey = args[++i].Trim();
                }
                else if (arg.Equals("-AuthToken", StringComparison.OrdinalIgnoreCase) || arg.Equals("-t", StringComparison.OrdinalIgnoreCase))
                {
                    if (i + 1 < args.Length) config.AuthToken = args[++i].Trim();
                }
                else if (arg.Equals("-BackendUrl", StringComparison.OrdinalIgnoreCase) || arg.Equals("-b", StringComparison.OrdinalIgnoreCase) || arg.Equals("/b", StringComparison.OrdinalIgnoreCase))
                {
                    if (i + 1 < args.Length) config.BackendUrl = args[++i].Trim();
                }
                else if (arg.Equals("-MachineOverride", StringComparison.OrdinalIgnoreCase) || arg.Equals("-m", StringComparison.OrdinalIgnoreCase))
                {
                    if (i + 1 < args.Length) config.MachineOverride = args[++i].Trim();
                }
                else if (arg.Equals("-Silent", StringComparison.OrdinalIgnoreCase) || arg.Equals("/silent", StringComparison.OrdinalIgnoreCase) || arg.Equals("/s", StringComparison.OrdinalIgnoreCase) || arg.Equals("-q", StringComparison.OrdinalIgnoreCase))
                {
                    config.Silent = true;
                }
                else if (arg.Equals("-Help", StringComparison.OrdinalIgnoreCase) || arg.Equals("/?", StringComparison.OrdinalIgnoreCase))
                {
                    MessageBox.Show("Nav Brahmi Driver Setup.exe\n\nUsage:\n  Setup.exe [-LicenseKey <KEY>] [-BackendUrl <URL>] [-Silent]", "Setup.exe Help", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return 0;
                }
            }

            if (config.Silent)
            {
                AttachConsole(ATTACH_PARENT_PROCESS);
            }

            // Check if environment variables are set
            if (string.IsNullOrEmpty(config.LicenseKey))
            {
                string envKey = Environment.GetEnvironmentVariable("LICENSE_KEY");
                if (!string.IsNullOrEmpty(envKey)) config.LicenseKey = envKey.Trim();
            }

            // AUTO-DETECTION: Check if signed payload is embedded in this executable
            if (string.IsNullOrEmpty(config.LicenseKey))
            {
                string detectedKey, detectedToken;
                string exeLoc = System.Reflection.Assembly.GetExecutingAssembly().Location;
                if (string.IsNullOrEmpty(exeLoc) || !File.Exists(exeLoc)) exeLoc = Application.ExecutablePath;

                if (InstallerEngine.TryDetectEmbeddedPayload(exeLoc, out detectedKey, out detectedToken))
                {
                    if (!string.IsNullOrEmpty(detectedKey))
                    {
                        config.LicenseKey = detectedKey;
                        config.AutoDetected = true;
                    }
                    if (!string.IsNullOrEmpty(detectedToken))
                    {
                        config.AuthToken = detectedToken;
                        config.AutoDetected = true;
                    }
                }
            }

            // AUTO-DETECTION FALLBACK: Check companion setup.ini or setup.auth in same folder
            if (string.IsNullOrEmpty(config.LicenseKey))
            {
                try
                {
                    string dir = Path.GetDirectoryName(Application.ExecutablePath);
                    string iniPath = Path.Combine(dir, "setup.ini");
                    if (File.Exists(iniPath))
                    {
                        foreach (string line in File.ReadAllLines(iniPath))
                        {
                            string t = line.Trim();
                            if (t.StartsWith("LicenseKey=", StringComparison.OrdinalIgnoreCase))
                            {
                                config.LicenseKey = t.Substring(11).Trim();
                                config.AutoDetected = true;
                                break;
                            }
                        }
                    }
                }
                catch { }
            }

            // AUTO-DETECTION FALLBACK: Check clipboard if it has NAV- or DEMO- license key (interactive only)
            if (!config.Silent && string.IsNullOrEmpty(config.LicenseKey))
            {
                try
                {
                    if (Clipboard.ContainsText())
                    {
                        string clip = Clipboard.GetText();
                        if (!string.IsNullOrEmpty(clip) && (clip.StartsWith("DEMO-") || clip.StartsWith("NAV-")))
                        {
                            config.LicenseKey = clip.Trim();
                        }
                    }
                }
                catch { }
            }

            // Check UAC elevation if interactive GUI mode
            if (!config.Silent && !InstallerEngine.IsAdministrator())
            {
                try
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = Application.ExecutablePath;
                    List<string> quotedArgs = new List<string>();
                    foreach (string a in args) quotedArgs.Add("\"" + a + "\"");
                    psi.Arguments = string.Join(" ", quotedArgs.ToArray());
                    psi.Verb = "runas";
                    psi.UseShellExecute = true;

                    Process elevatedProc = Process.Start(psi);
                    return 0;
                }
                catch
                {
                    // User declined UAC prompt
                }
            }

            if (config.Silent)
            {
                string err;
                bool reboot;
                InstallerEngine engine = new InstallerEngine(config, (m) => Console.WriteLine(m), (p, s) => { });
                bool ok = engine.RunInstallation(out err, out reboot);
                if (!ok) Console.Error.WriteLine("[FATAL ERROR] " + err);
                return ok ? 0 : 1;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new SetupForm(config));
            return 0;
        }
    }
}
