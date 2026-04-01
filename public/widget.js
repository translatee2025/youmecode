(function() {
  const els = document.querySelectorAll('[data-nexus-venue]');
  const baseUrl = document.currentScript?.src?.replace('/widget.js', '') || '';
  
  els.forEach(function(el) {
    const slug = el.getAttribute('data-nexus-venue');
    if (!slug) return;
    
    fetch(baseUrl + '/functions/v1/widget?slug=' + encodeURIComponent(slug))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) return;
        var iframe = document.createElement('iframe');
        iframe.style.cssText = 'border:none;width:100%;height:180px;background:transparent;';
        iframe.srcdoc = '<!DOCTYPE html><html><head><style>body{font-family:system-ui,sans-serif;margin:0;padding:16px;background:#1a1a2e;color:#f0f0f0;border-radius:12px;}'
          + '.card{display:flex;gap:16px;align-items:center}.img{width:80px;height:80px;border-radius:8px;object-fit:cover;background:#333}'
          + '.info{flex:1}.name{font-size:18px;font-weight:700;margin-bottom:4px}.stats{font-size:13px;color:#999;display:flex;gap:12px}'
          + '.btn{display:inline-block;margin-top:10px;padding:6px 16px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none;font-size:13px}'
          + '</style></head><body><div class="card">'
          + (data.cover_image_url ? '<img class="img" src="' + data.cover_image_url + '" />' : '<div class="img"></div>')
          + '<div class="info"><div class="name">' + data.name + '</div>'
          + '<div class="stats"><span>★ ' + (data.rating_avg || 0).toFixed(1) + ' (' + (data.rating_count || 0) + ')</span>'
          + '<span>♥ ' + (data.likes_count || 0) + '</span>'
          + '<span>' + (data.followers_count || 0) + ' followers</span></div>'
          + '<a class="btn" href="' + baseUrl + '/venues/' + slug + '" target="_blank">View on ' + data.site_name + '</a>'
          + '</div></div></body></html>';
        el.appendChild(iframe);
      })
      .catch(function() {});
  });
})();
