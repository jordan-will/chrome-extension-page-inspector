
const inspectButton = document.querySelector<HTMLButtonElement>(
  "#inspect-button"
);

if (inspectButton) {
  inspectButton.addEventListener("click", () => {
    inspectButton.textContent = "Inspection coming in M2";
    inspectButton.disabled = true;
  });
}
