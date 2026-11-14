const buttons = document.querySelectorAll("button[data-url]");
const statusBadge = document.getElementById("status-badge");
const responseBody = document.getElementById("response-body");

async function callEndpoint(method, url) {
  statusBadge.textContent = "Loading...";
  statusBadge.className = "status-badge";

  try {
    const response = await fetch(url, { method });
    statusBadge.textContent = `${response.status} ${response.statusText}`;
    statusBadge.className = response.ok ? "status-badge status-ok" : "status-badge status-err";

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const jsonData = await response.json();
      responseBody.textContent = JSON.stringify(jsonData, null, 2);
    } else {
      responseBody.textContent = await response.text();
    }
  } catch (err) {
    statusBadge.textContent = "Network Error";
    statusBadge.className = "status-badge status-err";
    responseBody.textContent = `Request failed: ${err.message}`;
  }
}

buttons.forEach((btn) => {
  btn.addEventListener("click", () => callEndpoint(btn.dataset.method, btn.dataset.url));
});
