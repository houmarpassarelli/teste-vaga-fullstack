<script lang="ts">

import { defineComponent } from 'vue';
import { invalidCNPJData, invalidCPFData } from "./metadata.js";

export default defineComponent({
  data() {
    return {
      loading: "none"
    }
  },
  methods: {
    validateCFPCNPJ(payload) {

      const converted = payload.match(/\d/g).join("");

      if (converted.length < 11) {
        return "CPF ou CNPJ inválidos!";
      }

      if (converted.length > 11) {
        //CNPJ Validator

        if (invalidCNPJData.includes(converted)) {
          return "CNPJ inválido!";
        }

        let size = converted.length - 2
        let numbers = converted.substring(0, size);
        let digits = converted.substring(size);
        let sum = 0;
        let pos = size - 7;

        for (let i = size; i >= 1; i--) {
          sum += numbers.charAt(size - i) * pos--;
          if (pos < 2)
            pos = 9;
        }

        let result = sum % 11 < 2 ? 0 : 11 - sum % 11;

        if (result != digits.charAt(0)) {
          return "CNPJ inválido!";
        }

        size++;

        numbers = converted.substring(0, size);
        sum = 0;
        pos = size - 7;

        for (let i = size; i >= 1; i--) {
          sum += numbers.charAt(size - i) * pos--;
          if (pos < 2)
            pos = 9;
        }

        result = sum % 11 < 2 ? 0 : 11 - sum % 11;

        if (result != digits.charAt(1)) {
          return "CNPJ inválido!";
        }

      } else {
        //CPF Validator

        let remaining;

        if (invalidCPFData.includes(converted)) {
          return "CPF inválido!";
        }

        let sum = 0;

        for (let i = 1; i <= 9; i++) {
          sum = sum + parseInt(converted.substring(i - 1, i)) * (11 - i);
        }

        remaining = (sum * 10) % 11;

        if ((remaining == 10) ||
          (remaining == 11)) {
          remaining = 0;
        }

        if (remaining != parseInt(converted.substring(9, 10))) {
          return "CPF inválido!";
        }

        sum = 0;

        for (let i = 1; i <= 10; i++) {
          sum += parseInt(converted.substring(i - 1, i)) * (12 - i);
        }

        remaining = (sum * 10) % 11;

        if ((remaining == 10) ||
          (remaining == 11)) {
          remaining = 0;
        }

        if (remaining != parseInt(converted.substring(10, 11))) {
          return "CPF inválido!";
        }
      }

      return payload;
    },
    monetaryConverter(payload, locale = 'pt-BR') {
      try {

        const parse = new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(payload);

        return parse;
      } catch (e) {
        console.log(e);
      }
    },
    caculateInstallments(payload, installment) {

      try {

        const converted = parseFloat(payload);
        const parted = (converted / parseInt(installment));

        return parted;
      } catch (e) {
        console.log(e);
      }
    },
    fileReader(event) {

      this.loading = "block";

      const file = event.target.files[0];

      if (file) {

        const reader = new FileReader();

        reader.readAsText(file, "UTF-8");

        reader.onload = (e) => {
          this.csvParser(e.target.result);
        };
      }
    },
    csvParser(payload) {
      try {

        const lines = payload.split("\n");

        const headers = lines[0].split(",");
        const data = [];

        lines.splice(0, 1);

        for (const line of lines) {

          const obj = {};
          const split = line.split(",");

          for (const [index, value] of split.entries()) {

            const header = headers[index];
            let vlTotal = 0;
            let qtPrestacoes = 0;

            if (header == "nrCpfCnpj") {
              obj[header] = this.validateCFPCNPJ(value);
            } else if (header == "vlTotal" ||
              header == "vlPresta" ||
              header == "vlMora" ||
              header == "vlMulta" ||
              header == "vlAtual") {

              if (header == "vlTotal") {
                vlTotal = parseInt(value);
              }

              if (obj[header] == "vlPresta") {
                const calculate = this.caculateInstallments(vlTotal / qtPrestacoes)
                obj[header] = this.monetaryConverter(calculate, "pt-BR");
              } else {
                obj[header] = this.monetaryConverter(value, "pt-BR");
              }
            } else {

              if (header == "qtPrestacoes") {
                qtPrestacoes = parseInt(value);
              }

              obj[header] = value;
            }
          }

          data.push(obj);
        }

        this.downloadJson(data);

      } catch (e) {
        console.log(e);
      }
    },
    downloadJson(content) {
      try {

        const data = `text/json;charset=utf-8, ${encodeURIComponent(JSON.stringify(content))}`

        const el = document.createElement("a");

        el.href = `data:${data}`;
        el.download = "data.json";
        el.click();
        el.remove();
        this.loading = "none";
      } catch (e) {
        console.log(e);
      }
    }
  }
})
</script>

<template>
  <div>
    <div class="padding">
      <h1>Carregar arquivo CSV</h1>
      <input type='file' @input="fileReader" />
    </div>
    <div class="loader" :style="{display: loading}"></div>
  </div>
</template>

<style scoped>
  .padding{
    padding: 25px;
  }

  .loader {
    border: 16px solid #f3f3f3; /* Light grey */
    border-top: 16px solid #3498db; /* Blue */
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: spin 2s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
