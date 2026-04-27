function validateForm() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const loginBtn = document.getElementById("loginBtn");

  // Validação básica de email e senha
  const emailValido = email.length > 0 && email.includes("@");
  const senhaValida = senha.length >= 6;

  // Habilita/desabilita o botão
  loginBtn.disabled = !(emailValido && senhaValida);
}

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  const eyeIcon = button.querySelector(".eye-icon");
  const eyeOffIcon = button.querySelector(".eye-off-icon");

  if (input.type === "password") {
    input.type = "text";
    eyeIcon.style.display = "none";
    eyeOffIcon.style.display = "block";
  } else {
    input.type = "password";
    eyeIcon.style.display = "block";
    eyeOffIcon.style.display = "none";
  }
}

// Submete o formulário
document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    try {
      // Desabilita o botão durante a requisição
      const loginBtn = document.getElementById("loginBtn");
      loginBtn.disabled = true;
      loginBtn.innerHTML = "<span>Entrando...</span>";

      // Faz requisição para o backend
      const response = await fetch("http://localhost:3000/api/usuarios/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (response.ok) {
        // Salva dados do usuário no localStorage
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userData", JSON.stringify(data.usuario));
        localStorage.setItem("userId", data.usuario.id);

        // Redireciona para a página do usuário
        window.location.href = "usuario.html";
      } else {
        // Mostra erro
        alert(data.erro || "Erro ao fazer login");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro de conexão com o servidor. Tente novamente.");
    } finally {
      // Reabilita o botão
      const loginBtn = document.getElementById("loginBtn");
      loginBtn.disabled = false;
      loginBtn.innerHTML = `
          <span>Entrar</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        `;
    }
  });
