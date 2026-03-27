async function list() {
  const url = "https://evolution.topconsultores.pt/instance/fetchInstances";
  const apiKey = "D387G7-S194M6-P709K2-W456E8"; // From previous session info
  
  const res = await fetch(url, {
    headers: { "apikey": apiKey }
  });
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

list();
