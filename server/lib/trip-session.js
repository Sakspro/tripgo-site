/* Shared Trip.com session helpers */
const TRIP_HOME = "https://www.trip.com/?locale=en-XX&curr=USD";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const HEAD = {
  locale: "en-XX",
  currency: "USD",
  site: "EN",
  group: "trip",
  source: "Online",
};

function parseCookies(setCookieHeaders) {
  const jar = {};
  if (!setCookieHeaders) return jar;
  for (const h of setCookieHeaders) {
    const part = h.split(";")[0];
    const eq = part.indexOf("=");
    if (eq > 0) jar[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return jar;
}

function cookieHeader(jar) {
  return Object.entries(jar).map(([k, v]) => k + "=" + v).join("; ");
}

function absUrl(url) {
  if (!url) return "";
  if (url.indexOf("//") === 0) return "https:" + url;
  if (url.indexOf("http") === 0) return url;
  return "https://www.trip.com" + (url.charAt(0) === "/" ? url : "/" + url);
}

function ok(res) {
  return res && res.ResponseStatus && res.ResponseStatus.Ack === "Success";
}

async function bootstrapSession() {
  const res = await fetch(TRIP_HOME, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
  });
  const jar = parseCookies(res.headers.getSetCookie ? res.headers.getSetCookie() : []);
  const html = await res.text();
  const vid = jar.UBT_VID || jar.GUID || "09034104117166574508";
  return { jar, vid, html };
}

function tripPost(jar, url, body) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": UA,
      Accept: "application/json",
      Origin: "https://www.trip.com",
      Referer: TRIP_HOME,
      Cookie: cookieHeader(jar),
    },
    body: JSON.stringify(body),
  }).then(function (r) { return r.json(); });
}

module.exports = { TRIP_HOME, UA, HEAD, bootstrapSession, tripPost, ok, absUrl, parseCookies, cookieHeader };
