// Carrega os dados do usuário do localStorage
document.addEventListener("DOMContentLoaded", function () {
  const userData = localStorage.getItem("userData");
  const userId = localStorage.getItem("userId");

  if (userData && userId) {
    const user = JSON.parse(userData);

    // Preenche o campo de email
    document.getElementById("email").value = user.email || "";

    // Preenche outros campos se existirem
    if (user.nome) document.getElementById("nome").value = user.nome;
    if (user.telefone)
      document.getElementById("telefone").value = user.telefone;
    if (user.data_nascimento)
      document.getElementById("nascimento").value = user.data_nascimento;
    if (user.genero) {
      const generoRadio = document.querySelector(
        `input[name="genero"][value="${user.genero}"]`,
      );
      if (generoRadio) generoRadio.checked = true;
    }
    if (user.cep) document.getElementById("cep").value = user.cep;
    if (user.endereco)
      document.getElementById("endereco").value = user.endereco;
    if (user.cidade) document.getElementById("cidade").value = user.cidade;
    if (user.estado) document.getElementById("estado").value = user.estado;
  } else {
    // Se não houver dados, redireciona para o login
    window.location.href = "login.html";
  }

  // Máscara para CEP
  document.getElementById("cep").addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 5) {
      value = value.slice(0, 5) + "-" + value.slice(5, 8);
    }
    e.target.value = value;
  });

  // Máscara para telefone
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

// Função de logout
function logout() {
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userData");
  localStorage.removeItem("userId");
  window.location.href = "login.html";
}

// Submete o formulário
document
  .getElementById("userInfoForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    if (!userId) {
      window.location.href = "login.html";
      return;
    }

    // Coleta os dados do formulário
    const formData = new FormData(e.target);
    const userData = {};

    for (let [key, value] of formData.entries()) {
      userData[key] = value;
    }

    try {
      // Desabilita o botão durante a requisição
      const saveBtn = document.getElementById("saveBtn");
      saveBtn.disabled = true;
      saveBtn.innerHTML = "<span>Salvando...</span>";

      // Faz requisição para o backend
      const response = await fetch(
        `http://localhost:3000/api/usuarios/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        },
      );

      const data = await response.json();

      if (response.ok) {
        // Atualiza dados no localStorage
        localStorage.setItem("userData", JSON.stringify(userData));

        // Mostra mensagem de sucesso
        alert("Informações salvas com sucesso!");

        // Redireciona para o questionário
        window.location.href = "index.html";
      } else {
        // Mostra erro
        alert(data.erro || "Erro ao salvar informações");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro de conexão com o servidor. Tente novamente.");
    } finally {
      // Reabilita o botão
      const saveBtn = document.getElementById("saveBtn");
      saveBtn.disabled = false;
      saveBtn.innerHTML = `
          <span>Salvar Informações</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        `;
    }
  });
