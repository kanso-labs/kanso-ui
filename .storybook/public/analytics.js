/*
 * Google Analytics 4 behind Google Consent Mode v2, for the Kanso Labs sites.
 *
 * The same file is copied into every Kanso Labs site that loads gtag.js
 * itself. Keep the copies identical; what differs between sites is in the
 * attributes of the <script> tag that loads it:
 *
 *   data-measurement-id  the GA4 measurement ID
 *   data-privacy-url     the site's privacy note, linked from the banner
 *   data-banner          "none" when the site draws the banner itself, through
 *                        window.kansoAnalytics; otherwise this file draws it
 *
 * A site that cannot set them, as on Mintlify, is listed in SITES below.
 *
 * Ads signals are denied for everyone, always. Analytics storage is denied by
 * default in the EEA, the UK and Switzerland, where the visitor is asked
 * first, and granted elsewhere, where a notice says so and offers a way out.
 *
 * Google applies the region-scoped default below by the visitor's IP. A static
 * site has no IP to go by, so whether to ask is decided from the browser's
 * time zone, and a zone that is missing or tells nothing, such as UTC, counts
 * as one that asks. Where this file asks, gtag.js is not loaded at all until
 * the visitor agrees, so nothing reaches Google before then.
 *
 * GA's cookies are kept to the site's own host rather than shared across
 * kansolabs.org, since each site keeps its own choice. Nothing is sent from a
 * host outside kansolabs.org, such as localhost or a fork's own Pages site, so
 * a local build never counts in the live property.
 */
;(function () {
  'use strict'

  // Mintlify includes a site's .js files itself, with no attributes of their
  // own, so docs.kansolabs.org's are written here instead.
  var SITES = {
    'docs.kansolabs.org': {
      measurementId: 'G-G5J7LFENG0',
      privacyUrl: '/privacy',
    },
  }

  var script = document.currentScript
  var options =
    (script && script.dataset && script.dataset.measurementId
      ? script.dataset
      : SITES[window.location.hostname]) || {}
  var id = options.measurementId
  if (!id || window.kansoAnalytics) return

  var live = /(^|\.)kansolabs\.org$/.test(window.location.hostname)
  var KEY = 'kanso-labs:analytics'
  var EVENT = 'kanso-analytics'

  // Where analytics storage starts denied: the EU, with Åland and the
  // outermost regions that have codes of their own, the rest of the EEA, the
  // UK with the Crown Dependencies, Gibraltar, and Switzerland.
  var REGIONS = [
    'AT',
    'AX',
    'BE',
    'BG',
    'CH',
    'CY',
    'CZ',
    'DE',
    'DK',
    'EE',
    'ES',
    'FI',
    'FR',
    'GB',
    'GF',
    'GG',
    'GI',
    'GP',
    'GR',
    'HR',
    'HU',
    'IE',
    'IM',
    'IS',
    'IT',
    'JE',
    'LI',
    'LT',
    'LU',
    'LV',
    'MF',
    'MQ',
    'MT',
    'NL',
    'NO',
    'PL',
    'PT',
    'RE',
    'RO',
    'SE',
    'SI',
    'SK',
    'YT',
  ]

  // The same places, by time zone. Every Europe/ zone counts, which takes in
  // a few countries outside these rules, so that no zone inside them is
  // missed; these are the ones elsewhere in the tz database.
  var ZONES = [
    'Africa/Ceuta',
    'America/Cayenne',
    'America/Guadeloupe',
    'America/Marigot',
    'America/Martinique',
    'America/St_Barthelemy',
    'Arctic/Longyearbyen',
    'Asia/Famagusta',
    'Asia/Nicosia',
    'Atlantic/Azores',
    'Atlantic/Canary',
    'Atlantic/Faroe',
    'Atlantic/Jan_Mayen',
    'Atlantic/Madeira',
    'Atlantic/Reykjavik',
    'Indian/Mayotte',
    'Indian/Reunion',
  ]

  var DENIED = 'denied'
  var GRANTED = 'granted'
  // Outside the consent regions: the visitor saw the notice and closed it.
  var NOTIFIED = 'notified'

  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = window.gtag || gtag

  gtag('consent', 'default', {
    ad_personalization: DENIED,
    ad_storage: DENIED,
    ad_user_data: DENIED,
    analytics_storage: DENIED,
    region: REGIONS,
  })
  gtag('consent', 'default', {
    ad_personalization: DENIED,
    ad_storage: DENIED,
    ad_user_data: DENIED,
    analytics_storage: GRANTED,
  })
  gtag('set', 'ads_data_redaction', true)

  function read() {
    try {
      return window.localStorage.getItem(KEY)
    } catch (error) {
      return null
    }
  }

  function write(value) {
    try {
      if (value) window.localStorage.setItem(KEY, value)
      else window.localStorage.removeItem(KEY)
    } catch (error) {
      // Storage is off: the choice holds for this page only.
    }
  }

  function zone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    } catch (error) {
      return ''
    }
  }

  var tz = zone()
  var asks =
    !/\//.test(tz) || /^(Etc|Europe)\//.test(tz) || ZONES.indexOf(tz) !== -1

  var choice = read()
  var loaded = false

  function load() {
    if (loaded) return
    loaded = true
    if (!live) return
    gtag('js', new Date())
    gtag('config', id, { allow_google_signals: false, cookie_domain: 'none' })
    var tag = document.createElement('script')
    tag.async = true
    tag.src =
      'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id)
    document.head.appendChild(tag)
  }

  // GA's own cookies, set while analytics storage was granted.
  function forget() {
    var host = window.location.hostname
    var domains = ['', host, '.' + host]
    // Where GA kept them before they were confined to the host.
    var parent = host.split('.').slice(-2).join('.')
    if (parent !== host) domains.push('.' + parent)
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim()
      if (name !== '_ga' && name.indexOf('_ga_') !== 0) return
      domains.forEach(function (domain) {
        document.cookie =
          name + '=; Max-Age=0; Path=/' + (domain ? '; Domain=' + domain : '')
      })
    })
  }

  // What the visitor is shown: 'consent' asks before anything is collected,
  // 'notice' says it is collected and how to stop it, and null is nothing.
  function prompt() {
    if (choice === GRANTED || choice === DENIED) return null
    if (asks) return 'consent'
    return choice === NOTIFIED ? null : 'notice'
  }

  function status() {
    if (choice === GRANTED || choice === DENIED) return choice
    return asks ? DENIED : GRANTED
  }

  function announce() {
    window.dispatchEvent(new CustomEvent(EVENT))
  }

  function grant() {
    choice = GRANTED
    write(choice)
    window['ga-disable-' + id] = false
    gtag('consent', 'update', { analytics_storage: GRANTED })
    load()
    announce()
  }

  function deny() {
    choice = DENIED
    write(choice)
    gtag('consent', 'update', { analytics_storage: DENIED })
    window['ga-disable-' + id] = true
    forget()
    announce()
  }

  function dismiss() {
    if (prompt() !== 'notice') return
    choice = NOTIFIED
    write(choice)
    announce()
  }

  if (choice === GRANTED) {
    gtag('consent', 'update', { analytics_storage: GRANTED })
    load()
  } else if (choice !== DENIED && !asks) {
    load()
  }

  window.kansoAnalytics = {
    deny: deny,
    dismiss: dismiss,
    event: EVENT,
    grant: grant,
    privacyUrl: options.privacyUrl || '',
    prompt: prompt,
    status: status,
  }

  if (options.banner !== 'none') banner()
  announce()

  // The banner for a site that does not draw its own. It is fixed to the
  // foot of the viewport, so it moves nothing on the page when it appears.
  function banner() {
    var root
    var STYLE =
      '.kanso-analytics{position:fixed;inset-inline:16px;inset-block-end:16px;z-index:2147483647;' +
      'box-sizing:border-box;max-inline-size:560px;margin-inline:auto;padding:16px;border-radius:12px;' +
      'color-scheme:light dark;background:#fff;color:#1b1b1b;background:light-dark(#fff,#2b2b2b);color:light-dark(#1b1b1b,#e6e6e6);' +
      'box-shadow:0 1px 3px rgb(0 0 0/.3),0 4px 8px 3px rgb(0 0 0/.15);' +
      'font:400 14px/20px "Roboto Flex Variable","Roboto Flex",Roboto,system-ui,sans-serif;letter-spacing:.25px}' +
      '.kanso-analytics p{margin:0}' +
      '.kanso-analytics a{color:inherit;text-decoration:underline}' +
      '.kanso-analytics div{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-block-start:12px}' +
      '.kanso-analytics button{min-block-size:40px;padding-inline:16px;border-radius:20px;cursor:pointer;' +
      'font:inherit;font-weight:500;letter-spacing:.1px;border:1px solid #777;border-color:light-dark(#777,#8e8e8e);' +
      'background:transparent;color:inherit}' +
      '.kanso-analytics button[data-primary]{border-color:transparent;background:#1b1b1b;color:#fff;' +
      'background:light-dark(#1b1b1b,#e6e6e6);color:light-dark(#fff,#1b1b1b)}' +
      '.kanso-analytics button:focus-visible,.kanso-analytics a:focus-visible{outline:3px solid light-dark(#1b1b1b,#e6e6e6);outline-offset:2px}'

    function button(label, action, primary) {
      var element = document.createElement('button')
      element.type = 'button'
      element.textContent = label
      if (primary) element.setAttribute('data-primary', '')
      element.addEventListener('click', action)
      return element
    }

    function draw() {
      var kind = prompt()
      if (root) root.remove()
      root = null
      if (!kind) return

      if (!document.getElementById('kanso-analytics-style')) {
        var style = document.createElement('style')
        style.id = 'kanso-analytics-style'
        style.textContent = STYLE
        document.head.appendChild(style)
      }

      root = document.createElement('section')
      root.className = 'kanso-analytics'
      root.setAttribute('aria-label', 'Analytics')

      var text = document.createElement('p')
      text.textContent =
        kind === 'consent'
          ? 'May this site count your visit with Google Analytics? It records the pages you open, without your name or any account, and nothing is sent unless you allow it. '
          : 'This site counts visits with Google Analytics: the pages opened, without your name or any account. '
      if (window.kansoAnalytics.privacyUrl) {
        var link = document.createElement('a')
        link.href = window.kansoAnalytics.privacyUrl
        link.textContent = 'Privacy'
        text.appendChild(link)
      }
      root.appendChild(text)

      var actions = document.createElement('div')
      if (kind === 'consent') {
        actions.appendChild(button('Decline', deny))
        actions.appendChild(button('Allow', grant, true))
      } else {
        actions.appendChild(button('Opt out', deny))
        actions.appendChild(button('OK', dismiss, true))
      }
      root.appendChild(actions)
      // First in the document, so the keyboard reaches it before the page.
      document.body.prepend(root)
    }

    window.addEventListener(EVENT, draw)
    if (document.body) draw()
    else document.addEventListener('DOMContentLoaded', draw)
  }
})()
