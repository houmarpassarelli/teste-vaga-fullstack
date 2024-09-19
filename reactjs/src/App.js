import { useState } from "react";
import './App.css';
import { invalidCNPJData, invalidCPFData} from "./metadata";

const App = () => {

  const [loading, setLoading] = useState("none");

  const validateCFPCNPJ = (payload) => {

    const converted = payload.match(/\d/g).join("");
  
    if(converted.length < 11){
        return "CPF ou CNPJ inválidos!";
    }
  
    if(converted.length > 11) {
        //CNPJ Validator
  
        if(invalidCNPJData.includes(converted)){
            return "CNPJ inválido!";
        }
  
        let size = converted.length - 2
        let numbers = converted.substring(0,size);
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
  
        numbers = converted.substring(0,size);
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
  
        if(invalidCPFData.includes(converted)){
            return "CPF inválido!";
        }
  
        let sum = 0;
  
        for(let i=1; i<=9; i++) {
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
  
        for(let i = 1; i <= 10; i++){
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
  };
  
  const monetaryConverter = (payload, locale = 'pt-BR') => {
    try {
  
        const parse = new Intl.NumberFormat(locale, {style: "currency", currency: "BRL"}).format(payload);
  
        return parse;
    } catch (e) {
        console.log(e);
    }
  };
  
  const caculateInstallments = (payload, installment) => {
  
    try {
  
        const converted = parseFloat(payload);
        const parted = (converted / parseInt(installment));
    
        return parted;
    } catch (e) {
        console.log(e);
    }
  };
  
  const fileReader = (event) => {
  
    setLoading("block");
  
    const file = event.target.files[0];
  
    if(file){
  
      const reader = new FileReader();
  
      reader.readAsText(file, "UTF-8");
  
      reader.onload = (e) => {
        csvParser(e.target.result);
      };
    }
  };
  
  const csvParser = (payload) => {
    try {
  
      const lines = payload.split("\n");
  
      const headers = lines[0].split(",");
      const data = [];
  
      lines.splice(0, 1);
  
      for(const line of lines){
  
          const obj = {};
          const split = line.split(",");
  
          for(const [index, value] of split.entries()){
  
              const header = headers[index];
              let vlTotal = 0;
              let qtPrestacoes = 0;
  
              if(header == "nrCpfCnpj"){
                  obj[header] = validateCFPCNPJ(value);
              } else if(header == "vlTotal" ||
                          header == "vlPresta" ||
                          header == "vlMora" ||
                          header == "vlMulta" ||
                          header == "vlAtual") {
  
                  if(header == "vlTotal"){
                      vlTotal = parseInt(value);
                  }
  
                  if(obj[header] == "vlPresta"){                    
                      const calculate = caculateInstallments(vlTotal, qtPrestacoes)
                      obj[header] = monetaryConverter(calculate, "pt-BR");
                  } else {
                      obj[header] = monetaryConverter(value, "pt-BR");
                  }
              } else {
  
                  if(header == "qtPrestacoes"){
                      qtPrestacoes = parseInt(value);
                  }
  
                  obj[header] = value;
              }
          }
  
          data.push(obj);
      }
  
      downloadJson(data);
  
    } catch (e) {
      console.log(e);
    }
  }
  
  const downloadJson = (content) => {
    try {
  
      const data = `text/json;charset=utf-8, ${encodeURIComponent(JSON.stringify(content))}`
  
      const el = document.createElement("a");
  
      el.href = `data:${data}`;
      el.download = "data.json";
      el.click();
      el.remove();
      setLoading("none");
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="App">
      <div className="padding">
        <h1>Carregar arquivo CSV</h1>
        <input type='file' onInput={fileReader} />
      </div>
      <div className="loader" style={{display: loading}}></div>
    </div>
  );
}

export default App;
