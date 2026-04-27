function validateCadastroForm() {
  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const confirmarSenha = document.getElementById("confirmarSenha").value;
  const telefone = document.getElementById("telefone").value;
  const nascimento = document.getElementById("nascimento").value;
  const genero = document.querySelector('input[name="genero"]:checked');
  const termos = document.getElementById("termos").checked;
  const cadastroBtn = document.getElementById("cadastroBtn");

  // Validação básica
  const nomeValido = nome.length >= 3;
  const emailValido = email.length > 0 && email.includes("@");
  const senhaValida = senha.length >= 6;
  const senhasIguais = senha === confirmarSenha && confirmarSenha.length > 0;
  const telefoneValido = telefone.length >= 14; // (00) 00000-0000
  const nascimentoValido = nascimento.length > 0;
  const generoValido = genero !== null;

  // Habilita/desabilita o botão
  cadastroBtn.disabled = !(
    nomeValido &&
    emailValido &&
    senhaValida &&
    senhasIguais &&
    telefoneValido &&
    nascimentoValido &&
    generoValido &&
    termos
  );
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

// Máscara para telefone
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("telefone").addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else {
      value = value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    e.target.value = value;
  });
});

// Submete o formulário
document
  .getElementById("cadastroForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const userData = {};

    // Converte FormData para objeto
    for (let [key, value] of formData.entries()) {
      if (key !== "confirmarSenha" && key !== "termos") {
        userData[key] = value;
      }
    }

    try {
      // Desabilita o botão durante a requisição
      const cadastroBtn = document.getElementById("cadastroBtn");
      cadastroBtn.disabled = true;
      cadastroBtn.innerHTML = "<span>Criando conta...</span>";

      // Faz requisição para o backend
      const response = await fetch(
        "http://localhost:3000/api/usuarios/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        },
      );

      const data = await response.json();

      if (response.ok) {
        // Mostra mensagem de sucesso
        alert(
          "Conta criada com sucesso! 🎉\n\nVocê será redirecionado para o questionário.",
        );

        // Salva dados do usuário no localStorage para login automático
        localStorage.setItem("userEmail", userData.email);
        localStorage.setItem(
          "userData",
          JSON.stringify({
            id: data.id,
            email: userData.email,
            nome: userData.nome,
            telefone: userData.telefone,
            data_nascimento: userData.nascimento,
            genero: userData.genero,
          }),
        );
        localStorage.setItem("userId", data.id);

        // Redireciona para o questionário
        window.location.href = "index.html";
      } else {
        // Mostra erro
        alert(data.erro || "Erro ao criar conta");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro de conexão com o servidor. Tente novamente.");
    } finally {
      // Reabilita o botão
      const cadastroBtn = document.getElementById("cadastroBtn");
      cadastroBtn.disabled = false;
      cadastroBtn.innerHTML = `
          <span>Criar Conta</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        `;
    }
  });
