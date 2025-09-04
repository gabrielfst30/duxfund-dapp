"use client"

import { useState } from "react";
import styles from "./styles.module.scss";

export function Contribute() {
  const [amount, setAmount] = useState(""); // só dígitos
  const [mintLink, setMintLink] = useState(""); // guardando link do qrcode

  // Número mínimo permitido
  const MIN_VALUE = 0.000001;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo que não for número
    const rawValue = event.target.value.replace(/\D/g, '');

    // Converte para número e divide por 1 milhão para ter 6 casas
    const numberValue = Number(rawValue) / 1_000_000;

    // Formata com 6 casas decimais fixas
    const formattedValue = numberValue.toFixed(6);

    setAmount(formattedValue);
  };

  // Enviando contribution
  const handleSendContribution = async () => {
    if (amount.length === 0) {
      alert(`Insira um valor para contribuir`);
      return;
    }

    // validando valor mínimo de envio
    if (Number(amount) < MIN_VALUE) {
      alert(`Valor mínimo permitido é ${MIN_VALUE}`);
      return;
    }

    try {
      // enviando requisição para send_contribution
      const sendContributionPaymentResponse = await fetch('/api/payment_payload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount
        }),
      });

      // pegando o response da send_contribution
      const contributionData = await sendContributionPaymentResponse.json();

      const { uuid, next } = contributionData;

      if (!uuid || !next) {
        throw new Error("Payload inválido");
      }

      console.log('Contribution response:', contributionData);

      // abrindo o deep link para a carteira
      window.open(contributionData.next, "_blank");

      // armazenando uuid
      const contributionId = contributionData.uuid

      console.log('Contribution UUID:', contributionId)

      // Começa o polling para verificar assinatura da tx
      const checkPaymentSignature = async () => {
        const res = await fetch('/api/check_payment_signature', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uuid: contributionId }),
        });

        const checkPaymentSignatureResult = await res.json();

        // Se a assinatura da transação estiver concluída
        if (checkPaymentSignatureResult?.resolved) {
          clearInterval(pollingTxInterval); // para o polling
          alert("Contribuição confirmada! Clique em 'Assinar NFT' para assinar seu NFT! 🚀");
          console.log("Dados da transação:", checkPaymentSignatureResult.tx);

          // Faça o mint do nft
          const mintRes = await fetch('/api/nft_payload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account: checkPaymentSignatureResult.account, txHash: checkPaymentSignatureResult.tx.hash }),
          });
          const { mintUuid, mintNext } = await mintRes.json();

          // Salva o link do mint pra exibir no botão
          setMintLink(mintNext);
          console.log("mintLink state atualizado:", mintLink);

          // Cheque de o NFT foi assinado pelo usuário
          const checkNftSignature = async () => {
            const res = await fetch('/api/check_nft_signature', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ mintUuid: mintUuid, paymentHash: checkPaymentSignatureResult.tx.hash }),
            });

            const checkNftSignatureResult = await res.json();

            // Para quando tiver um retorno do res.json()
            if (checkNftSignatureResult.resolved) {
              clearInterval(pollingNftInterval);
              alert('🎉 NFT cunhado na sua wallet!');
              setAmount("");
            }
            setAmount("");
          }
          // Polling do nft a cada 5 segundos
          const pollingNftInterval = setInterval(checkNftSignature, 5000);

        }
      };

      // Polling da tx cada 5 segundos
      const pollingTxInterval = setInterval(checkPaymentSignature, 5000);

      // zerando amount
      setAmount("");

    } catch (error) {
      console.error('Erro ao enviar contribuição:', error);
      alert('Erro ao enviar contribuição. Tente novamente.');
    }
  };

  return (
    <div className={styles.Contribute}>
      <div className={styles.header}>
        <h1>Contribute to the DuxFund</h1>
        <p>Enter the amount you want to send in XRP.</p>
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="amount">Amount (XRP):</label>
        <input
          id="amount"
          type="text"
          placeholder="0.000001"
          className={styles.amountInput}
          value={amount}
          onChange={handleChange}
        />
      </div>

      <div className={styles.buttonWrapper}>
        <button onClick={handleSendContribution}>Send Contribution</button>
      </div>

      <div>
        <p>Clique abaixo para assinar o NFT na Xumm Wallet:</p>
        <button className={styles.mintButton} onClick={() => window.open(mintLink, '_blank')} disabled={!mintLink}>
          Assinar NFT
        </button>
      </div>
    </div>
  );
}
