const fs = require("node:fs");
const { invalidCNPJData, invalidCPFData} = require("./metadata");

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

const csvParser = (file) => {
    try {

        const payload = fs.readFileSync(file, "utf8");
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
                        const calculate = caculateInstallments(vlTotal / qtPrestacoes)
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

        fs.writeFileSync("data.json", JSON.stringify(data), "utf8");
    } catch (e) {
        console.log(e);
    }
};

(async (file) => {
    try{
        csvParser(file);

        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
})(process.argv[2]);