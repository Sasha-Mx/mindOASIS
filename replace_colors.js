const fs = require('fs');

function globalSync() {
  const authFiles = ['src/pages/Home.jsx', 'src/pages/Login.jsx', 'src/pages/Signup.jsx'];
  
  authFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/text-navy/g, 'text-[var(--text-1)]');
    content = content.replace(/bg-navy/g, 'bg-[var(--navy)]');
    content = content.replace(/text-text-2/g, 'text-[var(--text-2)]');
    content = content.replace(/text-text-3/g, 'text-[var(--text-3)]');
    content = content.replace(/bg-blue-1/g, 'bg-[var(--bg-page)]');
    content = content.replace(/shadow-navy/g, 'shadow-[var(--navy)]');
    fs.writeFileSync(file, content);
  });

  const dashboard = 'src/pages/Dashboard.jsx';
  let dash = fs.readFileSync(dashboard, 'utf8');
  dash = dash.replace(/#f4f7ff/g, 'var(--bg-page)');
  dash = dash.replace(/#1a1d2e/g, 'var(--navy)');
  dash = dash.replace(/#4a5480/g, 'var(--text-2)');
  dash = dash.replace(/#8090c0/g, 'var(--text-3)');
  dash = dash.replace(/#4a7fe0/g, 'var(--blue-primary)');
  dash = dash.replace(/#e0e8ff/g, 'var(--input-border)');
  dash = dash.replace(/#f0f5ff/g, 'var(--blue-light)');
  dash = dash.replace(/#b8d0fa/g, 'var(--blue-mid)');
  fs.writeFileSync(dashboard, dash);
}

globalSync();
console.log("Colors swapped mapped to generic vars successfully");
