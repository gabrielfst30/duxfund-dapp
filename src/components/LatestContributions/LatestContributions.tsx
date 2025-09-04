
import styles from "./styles.module.scss";
import { useState, useEffect } from "react";

interface Contribution {
  id: number;
  tx_hash: string;
  nft_hash: string;
  payment_hash: string;
  type: string;
  uri: string;
  taxon: number;
  created_at: string;
}

export function LatestContributions() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getContributions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/show_all_nfts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar contribuições');
      }

      const responseResult = await response.json();
      
      if (responseResult && Array.isArray(responseResult)) {
        setContributions(responseResult);
      } else {
        setContributions([]);
      }
    } catch (err) {
      console.error('Erro ao carregar contribuições:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setContributions([]);
    } finally {
      setLoading(false);
    }
  }


  console.log(contributions)

  useEffect(() => {
    getContributions()
  }, [])

  if (loading) {
    return (
      <div className={styles.Lastest}>
        <h1>Latest Contributions (LP Token)</h1>
        <div className={styles.list}>
          <div className={styles.card}>
            <div className={styles.left}>
              <span className={styles.address}>Carregando...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.Lastest}>
      <h1>Latest Contributions (LP Token)</h1>
      <div className={styles.list}>
        {(!contributions || contributions.length === 0) ? (
          <div className={styles.card}>
            <div className={styles.left}>
              <span className={styles.address}>No contributions yet.</span>
            </div>
          </div>
        ) : (
          contributions.map((contribution, index) => {
            return (
              <div className={styles.card} key={index}>
                <div className={styles.left}>
                  {/* <span className={styles.address}>Payment Tx: {contribution.payment_hash}</span> */}
                  <span className={styles.nft}>{contribution.nft_hash}</span>
                  <span className={styles.time}>
                    {contribution.created_at}
                  </span>
                </div>
                <div className={styles.right}>{} XRP</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
