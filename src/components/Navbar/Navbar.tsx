"use client"
import Image from "next/image";
import styles from "./styles.module.scss";
import { useState, useEffect } from 'react'
import { isInstalled, getAddress, GetAddressResponse } from "@gemwallet/api";


export function Navbar() {
  const [account, setAccount] = useState('') // Endereço da carteira
  const [payloadUuid, setPayloadUuid] = useState('') // UUID gerado pela API do XUMM
  const [isConnecting, setIsConnecting] = useState(false) // Loading de conexão
  const [connectUrl, setConnectUrl] = useState('') // URL gerada para assinar o payload
  const [name, setName] = useState("Victor")
  const [error, setError] = useState('')

  const connectWallet = async () => {
    setError(""); // setando o erro como vazio
    setIsConnecting(true); // iniciando o loading de conexão
    try {
      const installed = await isInstalled(); // chama a função para verificar se a GemWallet está instalada
      console.log("GemWallet installed:", installed); // log para debug
      // Verifica se a GemWallet está instalada
      if (!installed) {
        setError("GemWallet is not installed")
        setIsConnecting(false);
        return;
      }
      const addressResponse: any = await getAddress(); // chama a função para obter o endereço
      console.log("Address esta retornando?: ", addressResponse); // log para debug
      // Verifica se o endereço foi obtido com sucesso
      if (addressResponse) {
        setAccount(addressResponse.result.address); // Salva o endereço real!)
      } else {
        setError("address failure")
      }
      
    } catch (err) {
      setError("Failed to connect to GemWallet");
    }
    
    setIsConnecting(false);
  };

  console.log("endereco salvo: ", account);






  // Função para criar um novo payload (request) de login
  // const createSignInPayload = async () => {
  //   try {
  //     setIsConnecting(true)
  //     const response = await fetch('/api/xumm_wallet', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({}) // Sem UUID = criar novo payload
  //     })

  //     if (!response.ok) {
  //       throw new Error('Falha ao criar payload')
  //     }

  //     // Resposta do payload
  //     const data = await response.json()
  //     setPayloadUuid(data.uuid) // Setando UUID do payload (assinatura)
  //     setConnectUrl(data.connectUrl) // URL para conectar

  //     // Abrir a URL da Xaman para conexão
  //     window.open(data.connectUrl, '_blank') // Abrir a URL da Xaman

  //     // Iniciar polling (envia o uuid gerado)
  //     startPolling(data.uuid)
  //   } catch (error) {
  //     console.error('Erro ao conectar:', error)
  //     setIsConnecting(false)
  //   }
  // }

  // // Função para fazer polling do status do payload 
  // const startPolling = (uuid: string) => {

  //   // (Envia um novo POST a cada 2 segundos passando o UUID do payload no body)
  //   const pollInterval = setInterval(async () => {
  //     try {
  //       const response = await fetch('/api/xumm_wallet', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({ uuid })
  //       })

  //       if (!response.ok) {
  //         throw new Error('Falha ao verificar status')
  //       }

  //       const data = await response.json()

  //       //response
  //       if (data.resolved) {
  //         // Usuário autenticou com sucesso
  //         setAccount(data.account)
  //         setPayloadUuid('')
  //         setConnectUrl('')
  //         setIsConnecting(false)
  //         clearInterval(pollInterval)
  //         console.log('Conectado com sucesso:', data.account)
  //       }
  //     } catch (error) {
  //       console.error('Erro no polling:', error)
  //       setIsConnecting(false)
  //       clearInterval(pollInterval)
  //     }
  //   }, 2000) // Verifica a cada 2 segundos

  //   // Parar polling após 5 minutos (timeout)
  //   setTimeout(() => {
  //     clearInterval(pollInterval)
  //     setIsConnecting(false)
  //     setPayloadUuid('')
  //     setConnectUrl('')
  //   }, 300000) // 5 minutos
  // }

  // // Função para deslogar
  // const logout = () => {
  //   setAccount('')
  //   setPayloadUuid('')
  //   setConnectUrl('')
  //   setIsConnecting(false)
  // }

  // // Função para conectar a wallet
  // const handleConnectWallet = () => {
  //   if (account) {
  //     // Se já está conectado, desconecta
  //     logout()
  //   } else if (!isConnecting) {
  //     // Se não está conectando, inicia o processo
  //     createSignInPayload()
  //   }
  // }

  return (
    <div className={styles.Navbar}>
      <div className={styles.logo}>
        <h1>
          <Image
            src="/logoduxfund.png"
            alt="Logo"
            width={40}
            height={40}
            className={styles.logoImage}
          />
          DuxFund {name}
        </h1>
      </div>

      <div className={styles.connect}>
        <div className={styles.connectText}>
          {isConnecting ? (
            <p>Conectando...</p>
          ) : account ? (
            <p>Conectado: {account.slice(0, 6)}...{account.slice(-4)}</p> // Mostra o início e o fim do endereço
          ) : (
            <button className={styles.connect} onClick={connectWallet}>Connect Wallet</button>
          )}
        </div>
      </div>
    </div>
  );
}