"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";

/**
 * Seeds the database with common available assets.
 */
export async function seedAvailableAssets() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const commonAssets = [
        // Ações B3
        { ticker: "RRRP3.SA", name: "3R Petroleum" },
        { ticker: "ALPA4.SA", name: "Alpargatas" },
        { ticker: "ABEV3.SA", name: "Ambev" },
        { ticker: "AMER3.SA", name: "Americanas" },
        { ticker: "ARZZ3.SA", name: "Arezzo" },
        { ticker: "ASAI3.SA", name: "Assaí" },
        { ticker: "AZUL4.SA", name: "Azul" },
        { ticker: "B3SA3.SA", name: "B3" },
        { ticker: "BBAS3.SA", name: "Banco do Brasil" },
        { ticker: "BBSE3.SA", name: "BB Seguridade" },
        { ticker: "BBDC3.SA", name: "Bradesco ON" },
        { ticker: "BBDC4.SA", name: "Bradesco PN" },
        { ticker: "BRAP4.SA", name: "Bradespar" },
        { ticker: "BRFS3.SA", name: "BRF" },
        { ticker: "BPAC11.SA", name: "BTG Pactual" },
        { ticker: "CRFB3.SA", name: "Carrefour Brasil" },
        { ticker: "CCRO3.SA", name: "CCR" },
        { ticker: "CMIG4.SA", name: "Cemig" },
        { ticker: "CIEL3.SA", name: "Cielo" },
        { ticker: "COGN3.SA", name: "Cogna" },
        { ticker: "CPLE6.SA", name: "Copel" },
        { ticker: "CSAN3.SA", name: "Cosan" },
        { ticker: "CPFE3.SA", name: "CPFL Energia" },
        { ticker: "CVCB3.SA", name: "CVC" },
        { ticker: "CYRE3.SA", name: "Cyrela" },
        { ticker: "DXCO3.SA", name: "Dexco" },
        { ticker: "ELET3.SA", name: "Eletrobras ON" },
        { ticker: "ELET6.SA", name: "Eletrobras PN" },
        { ticker: "EMBR3.SA", name: "Embraer" },
        { ticker: "ENGI11.SA", name: "Energisa" },
        { ticker: "ENEV3.SA", name: "Eneva" },
        { ticker: "EGIE3.SA", name: "Engie" },
        { ticker: "EQTL3.SA", name: "Equatorial" },
        { ticker: "EZTC3.SA", name: "EZTEC" },
        { ticker: "FLRY3.SA", name: "Fleury" },
        { ticker: "GGBR4.SA", name: "Gerdau" },
        { ticker: "GOAU4.SA", name: "Gerdau Metalúrgica" },
        { ticker: "GOLL4.SA", name: "Gol" },
        { ticker: "HAPV3.SA", name: "Hapvida" },
        { ticker: "HYPE3.SA", name: "Hypera" },
        { ticker: "IGTI11.SA", name: "Iguatemi" },
        { ticker: "IRBR3.SA", name: "IRB Brasil" },
        { ticker: "ITSA4.SA", name: "Itaúsa" },
        { ticker: "ITUB4.SA", name: "Itaú Unibanco" },
        { ticker: "JBSS3.SA", name: "JBS" },
        { ticker: "KLBN11.SA", name: "Klabin" },
        { ticker: "RENT3.SA", name: "Localiza" },
        { ticker: "LREN3.SA", name: "Lojas Renner" },
        { ticker: "LWSA3.SA", name: "Locaweb" },
        { ticker: "MGLU3.SA", name: "Magazine Luiza" },
        { ticker: "MRVE3.SA", name: "MRV" },
        { ticker: "BEEF3.SA", name: "Minerva" },
        { ticker: "MULT3.SA", name: "Multiplan" },
        { ticker: "NTCO3.SA", name: "Natura" },
        { ticker: "PETR3.SA", name: "Petrobras ON" },
        { ticker: "PETR4.SA", name: "Petrobras PN" },
        { ticker: "PRIO3.SA", name: "PetroRio" },
        { ticker: "PETZ3.SA", name: "Petz" },
        { ticker: "RADL3.SA", name: "RaiaDrogasil" },
        { ticker: "RAIZ4.SA", name: "Raízen" },
        { ticker: "RDOR3.SA", name: "Rede D'Or" },
        { ticker: "RAIL3.SA", name: "Rumo" },
        { ticker: "SBSP3.SA", name: "Sabesp" },
        { ticker: "SANB11.SA", name: "Santander" },
        { ticker: "SMTO3.SA", name: "São Martinho" },
        { ticker: "CSNA3.SA", name: "Siderúrgica Nacional" },
        { ticker: "SLCE3.SA", name: "SLC Agrícola" },
        { ticker: "SUZB3.SA", name: "Suzano" },
        { ticker: "TAEE11.SA", name: "Taesa" },
        { ticker: "VIVT3.SA", name: "Telefônica Brasil" },
        { ticker: "TIMS3.SA", name: "TIM" },
        { ticker: "TOTS3.SA", name: "Totvs" },
        { ticker: "UGPA3.SA", name: "Ultrapar" },
        { ticker: "USIM5.SA", name: "Usiminas" },
        { ticker: "VALE3.SA", name: "Vale" },
        { ticker: "VAMO3.SA", name: "Grupo Vamos" },
        { ticker: "VBBR3.SA", name: "Vibra Energia" },
        { ticker: "WEGE3.SA", name: "WEG" },
        { ticker: "YDUQ3.SA", name: "Yduqs" },

        // FIIs
        { ticker: "MXRF11.SA", name: "Maxi Renda" },
        { ticker: "HGLG11.SA", name: "CGHG Logística" },
        { ticker: "KNRI11.SA", name: "Kinea Renda" },
        { ticker: "XPLG11.SA", name: "XP Log" },
        { ticker: "XPIN11.SA", name: "XP Industrial" },
        { ticker: "VISC11.SA", name: "Vinci Shopping" },
        { ticker: "HGRE11.SA", name: "HG Real Estate" },
        { ticker: "HGBS11.SA", name: "Hedge Brasil Shopping" },
        { ticker: "BTLG11.SA", name: "BTG Pactual Log" },
        { ticker: "RECR11.SA", name: "Recv Recebíveis" },
        { ticker: "CPTS11.SA", name: "Capitânia Securities" },
        { ticker: "IRDM11.SA", name: "Iridium Recebíveis" },
        { ticker: "KNCR11.SA", name: "Kinea Rendimentos" },
        { ticker: "ALZR11.SA", name: "Alianza Trust Renda" },
        { ticker: "BCFF11.SA", name: "BTG Fundo de Fundos" },
        { ticker: "HSML11.SA", name: "HSI Malls" },
        { ticker: "MALL11.SA", name: "Malls Brasil Plural" },
        { ticker: "TRXF11.SA", name: "TRX Real Estate" },
        { ticker: "LVBI11.SA", name: "VBI Logística" },
        { ticker: "VILG11.SA", name: "Vinci Logística" },

        // Criptos
        { ticker: "BTC-USD", name: "Bitcoin" },
        { ticker: "ETH-USD", name: "Ethereum" },
        { ticker: "SOL-USD", name: "Solana" },
        { ticker: "XRP-USD", name: "XRP" },
        { ticker: "BNB-USD", name: "BNB" },
        { ticker: "ADA-USD", name: "Cardano" },
        { ticker: "DOGE-USD", name: "Dogecoin" },
        { ticker: "DOT-USD", name: "Polkadot" },
        { ticker: "MATIC-USD", name: "Polygon" },
        { ticker: "LINK-USD", name: "Chainlink" },
        { ticker: "DAI-USD", name: "Dai" },
        { ticker: "LTC-USD", name: "Litecoin" },
        { ticker: "BCH-USD", name: "Bitcoin Cash" },
        { ticker: "SHIB-USD", name: "Shiba Inu" },
        { ticker: "UNI-USD", name: "Uniswap" },
        { ticker: "AVAX-USD", name: "Avalanche" },
        { ticker: "XLM-USD", name: "Stellar" },
        { ticker: "ATOM-USD", name: "Cosmos" },
        { ticker: "NEAR-USD", name: "NEAR Protocol" },
        { ticker: "LDO-USD", name: "Lido DAO" },
        { ticker: "VET-USD", name: "VeChain" },
        { ticker: "INJ-USD", name: "Injective" },
        { ticker: "RNDR-USD", name: "Render" },
        { ticker: "FET-USD", name: "Fetch.ai" },
        { ticker: "PEPE-USD", name: "Pepe" },

        // ETFs & Índices
        { ticker: "BOVA11.SA", name: "iShares Ibovespa" },
        { ticker: "SMAL11.SA", name: "iShares Small Cap" },
        { ticker: "IVVB11.SA", name: "iShares S&P 500" },
        { ticker: "HASH11.SA", name: "Hashdex Nasdaq Crypto" },
        { ticker: "QBTC11.SA", name: "QR Bitcoin ETF" },
        { ticker: "QETH11.SA", name: "QR Ethereum ETF" },
        { ticker: "USTBRL=X", name: "Dólar / Real" },
        { ticker: "^BVSP", name: "Ibovespa" },
        { ticker: "^GSPC", name: "S&P 500" },

        // Ações EUA
        { ticker: "AAPL", name: "Apple Inc." },
        { ticker: "MSFT", name: "Microsoft Corp." },
        { ticker: "GOOGL", name: "Alphabet Inc." },
        { ticker: "TSLA", name: "Tesla Inc." },
    ];

    let processedCount = 0;

    for (const asset of commonAssets) {
        await prisma.availableAsset.upsert({
            where: { ticker: asset.ticker },
            update: { name: asset.name },
            create: asset,
        });
        processedCount++;
    }

    return { success: true, count: processedCount };
}
