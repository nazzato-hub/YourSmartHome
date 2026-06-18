-- Script di popolatamento dispositivi in PL/pgSQL
DO $$
DECLARE
  d_id integer;
BEGIN
  -- ===========================================================================
  -- 1. ILLUMINAZIONE (10 dispositivi)
  -- ===========================================================================
  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Lampada Soggiorno', 'Illuminazione', false, 15) RETURNING id_dispositivo INTO d_id;
  INSERT INTO illuminazione (id_dispositivo, intensita, colore_rgb) VALUES (d_id, 80, '#FFCC00');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Lampadario Cucina', 'Illuminazione', false, 24) RETURNING id_dispositivo INTO d_id;
  INSERT INTO illuminazione (id_dispositivo, intensita, colore_rgb) VALUES (d_id, 100, '#FFFFFF');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Faretto Bagno', 'Illuminazione', false, 8) RETURNING id_dispositivo INTO d_id;
  INSERT INTO illuminazione (id_dispositivo, intensita, colore_rgb) VALUES (d_id, 90, '#E0F7FA');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Luce Ingresso', 'Illuminazione', false, 12) RETURNING id_dispositivo INTO d_id;
  INSERT INTO illuminazione (id_dispositivo, intensita, colore_rgb) VALUES (d_id, 100, '#FFFDE7');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Lampada da Lettura', 'Illuminazione', false, 6) RETURNING id_dispositivo INTO d_id;
  INSERT INTO illuminazione (id_dispositivo, intensita, colore_rgb) VALUES (d_id, 50, '#FFEB3B');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Applique Corridoio', 'Illuminazione', false, 10) RETURNING id_dispositivo INTO d_id;
  INSERT INTO illuminazione (id_dispositivo, intensita, colore_rgb) VALUES (d_id, 70, '#FFF9C4');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Striscia LED Letto', 'Illuminazione', false, 18) RETURNING id_dispositivo INTO d_id;
  INSERT INTO illuminazione (id_dispositivo, intensita, colore_rgb) VALUES (d_id, 40, '#E040FB');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Luce Giardino', 'Illuminazione', false, 30) RETURNING id_dispositivo INTO d_id;
  INSERT INTO illuminazione (id_dispositivo, intensita, colore_rgb) VALUES (d_id, 100, '#FFFFFF');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Lampadario Tavolo', 'Illuminazione', false, 28) RETURNING id_dispositivo INTO d_id;
  INSERT INTO illuminazione (id_dispositivo, intensita, colore_rgb) VALUES (d_id, 85, '#FFF3E0');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Faretto Specchio', 'Illuminazione', false, 7) RETURNING id_dispositivo INTO d_id;
  INSERT INTO illuminazione (id_dispositivo, intensita, colore_rgb) VALUES (d_id, 95, '#E0F2F1');

  -- ===========================================================================
  -- 2. PORTA PRINCIPALE / SERRATURE (10 dispositivi)
  -- ===========================================================================
  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Serratura Ingresso', 'Porta_Principale', false, 2) RETURNING id_dispositivo INTO d_id;
  INSERT INTO porta_principale (id_dispositivo, stato_serratura) VALUES (d_id, 'chiusa');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Porta Garage', 'Porta_Principale', false, 150) RETURNING id_dispositivo INTO d_id;
  INSERT INTO porta_principale (id_dispositivo, stato_serratura) VALUES (d_id, 'chiusa');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Cancello Esterno', 'Porta_Principale', false, 200) RETURNING id_dispositivo INTO d_id;
  INSERT INTO porta_principale (id_dispositivo, stato_serratura) VALUES (d_id, 'chiusa');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Porta Sul Retro', 'Porta_Principale', false, 2) RETURNING id_dispositivo INTO d_id;
  INSERT INTO porta_principale (id_dispositivo, stato_serratura) VALUES (d_id, 'chiusa');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Serratura Cantina', 'Porta_Principale', false, 1) RETURNING id_dispositivo INTO d_id;
  INSERT INTO porta_principale (id_dispositivo, stato_serratura) VALUES (d_id, 'chiusa');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Porta Studio', 'Porta_Principale', false, 2) RETURNING id_dispositivo INTO d_id;
  INSERT INTO porta_principale (id_dispositivo, stato_serratura) VALUES (d_id, 'aperta');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Serratura Mansarda', 'Porta_Principale', false, 1) RETURNING id_dispositivo INTO d_id;
  INSERT INTO porta_principale (id_dispositivo, stato_serratura) VALUES (d_id, 'chiusa');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Cancello Pedonale', 'Porta_Principale', false, 25) RETURNING id_dispositivo INTO d_id;
  INSERT INTO porta_principale (id_dispositivo, stato_serratura) VALUES (d_id, 'chiusa');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Porta Taverna', 'Porta_Principale', false, 2) RETURNING id_dispositivo INTO d_id;
  INSERT INTO porta_principale (id_dispositivo, stato_serratura) VALUES (d_id, 'chiusa');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Porta Cucina Esterna', 'Porta_Principale', false, 2) RETURNING id_dispositivo INTO d_id;
  INSERT INTO porta_principale (id_dispositivo, stato_serratura) VALUES (d_id, 'chiusa');

  -- ===========================================================================
  -- 3. TERMOSTATO (10 dispositivi)
  -- ===========================================================================
  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Termostato Soggiorno', 'Termostato', false, 5) RETURNING id_dispositivo INTO d_id;
  INSERT INTO termostato (id_dispositivo, temperatura_impostata, temperatura_rilevata, modalita) 
  VALUES (d_id, 21.5, 20.8, 'riscaldamento');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Climatizzatore Cucina', 'Termostato', false, 900) RETURNING id_dispositivo INTO d_id;
  INSERT INTO termostato (id_dispositivo, temperatura_impostata, temperatura_rilevata, modalita) 
  VALUES (d_id, 24.0, 26.2, 'raffreddamento');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Riscaldamento Bagno', 'Termostato', false, 1200) RETURNING id_dispositivo INTO d_id;
  INSERT INTO termostato (id_dispositivo, temperatura_impostata, temperatura_rilevata, modalita) 
  VALUES (d_id, 23.0, 21.1, 'riscaldamento');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Termostato Camera', 'Termostato', false, 4) RETURNING id_dispositivo INTO d_id;
  INSERT INTO termostato (id_dispositivo, temperatura_impostata, temperatura_rilevata, modalita) 
  VALUES (d_id, 19.0, 18.5, 'riscaldamento');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Clima Studio', 'Termostato', false, 750) RETURNING id_dispositivo INTO d_id;
  INSERT INTO termostato (id_dispositivo, temperatura_impostata, temperatura_rilevata, modalita) 
  VALUES (d_id, 22.0, 24.5, 'raffreddamento');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Termostato Corridoio', 'Termostato', false, 3) RETURNING id_dispositivo INTO d_id;
  INSERT INTO termostato (id_dispositivo, temperatura_impostata, temperatura_rilevata, modalita) 
  VALUES (d_id, 20.0, 19.8, 'riscaldamento');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Riscaldamento Mansarda', 'Termostato', false, 1000) RETURNING id_dispositivo INTO d_id;
  INSERT INTO termostato (id_dispositivo, temperatura_impostata, temperatura_rilevata, modalita) 
  VALUES (d_id, 18.0, 16.5, 'spento');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Termostato Taverna', 'Termostato', false, 5) RETURNING id_dispositivo INTO d_id;
  INSERT INTO termostato (id_dispositivo, temperatura_impostata, temperatura_rilevata, modalita) 
  VALUES (d_id, 20.5, 18.2, 'riscaldamento');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Clima Ospiti', 'Termostato', false, 800) RETURNING id_dispositivo INTO d_id;
  INSERT INTO termostato (id_dispositivo, temperatura_impostata, temperatura_rilevata, modalita) 
  VALUES (d_id, 23.0, 23.0, 'raffreddamento');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Riscaldamento Ingresso', 'Termostato', false, 5) RETURNING id_dispositivo INTO d_id;
  INSERT INTO termostato (id_dispositivo, temperatura_impostata, temperatura_rilevata, modalita) 
  VALUES (d_id, 20.0, 19.1, 'riscaldamento');

  -- ===========================================================================
  -- 4. TAPPARELLE (10 dispositivi)
  -- ===========================================================================
  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Tapparella Soggiorno', 'Tapparelle', false, 110) RETURNING id_dispositivo INTO d_id;
  INSERT INTO tapparelle (id_dispositivo, percentuale_apertura) VALUES (d_id, 100);

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Tapparella Cucina', 'Tapparelle', false, 110) RETURNING id_dispositivo INTO d_id;
  INSERT INTO tapparelle (id_dispositivo, percentuale_apertura) VALUES (d_id, 50);

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Tapparella Camera', 'Tapparelle', false, 110) RETURNING id_dispositivo INTO d_id;
  INSERT INTO tapparelle (id_dispositivo, percentuale_apertura) VALUES (d_id, 0);

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Tapparella Studio', 'Tapparelle', false, 110) RETURNING id_dispositivo INTO d_id;
  INSERT INTO tapparelle (id_dispositivo, percentuale_apertura) VALUES (d_id, 80);

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Tapparella Bagno', 'Tapparelle', false, 110) RETURNING id_dispositivo INTO d_id;
  INSERT INTO tapparelle (id_dispositivo, percentuale_apertura) VALUES (d_id, 20);

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Tapparella Cameretta', 'Tapparelle', false, 110) RETURNING id_dispositivo INTO d_id;
  INSERT INTO tapparelle (id_dispositivo, percentuale_apertura) VALUES (d_id, 0);

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Tapparella Corridoio', 'Tapparelle', false, 110) RETURNING id_dispositivo INTO d_id;
  INSERT INTO tapparelle (id_dispositivo, percentuale_apertura) VALUES (d_id, 100);

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Tapparella Mansarda', 'Tapparelle', false, 110) RETURNING id_dispositivo INTO d_id;
  INSERT INTO tapparelle (id_dispositivo, percentuale_apertura) VALUES (d_id, 30);

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Tapparella Taverna', 'Tapparelle', false, 110) RETURNING id_dispositivo INTO d_id;
  INSERT INTO tapparelle (id_dispositivo, percentuale_apertura) VALUES (d_id, 0);

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Tapparella Ripostiglio', 'Tapparelle', false, 110) RETURNING id_dispositivo INTO d_id;
  INSERT INTO tapparelle (id_dispositivo, percentuale_apertura) VALUES (d_id, 100);

  -- ===========================================================================
  -- 5. VIDEOSORVEGLIANZA (10 dispositivi)
  -- ===========================================================================
  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Telecamera Ingresso', 'Videosorveglianza', false, 6) RETURNING id_dispositivo INTO d_id;
  INSERT INTO videosorveglianza (id_dispositivo, registrazione_attiva, risoluzione) VALUES (d_id, true, '1080p');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Telecamera Garage', 'Videosorveglianza', false, 6) RETURNING id_dispositivo INTO d_id;
  INSERT INTO videosorveglianza (id_dispositivo, registrazione_attiva, risoluzione) VALUES (d_id, true, '1080p');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Telecamera Giardino', 'Videosorveglianza', false, 8) RETURNING id_dispositivo INTO d_id;
  INSERT INTO videosorveglianza (id_dispositivo, registrazione_attiva, risoluzione) VALUES (d_id, true, '2K');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Telecamera Cortile', 'Videosorveglianza', false, 8) RETURNING id_dispositivo INTO d_id;
  INSERT INTO videosorveglianza (id_dispositivo, registrazione_attiva, risoluzione) VALUES (d_id, true, '1080p');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Telecamera Salotto', 'Videosorveglianza', false, 5) RETURNING id_dispositivo INTO d_id;
  INSERT INTO videosorveglianza (id_dispositivo, registrazione_attiva, risoluzione) VALUES (d_id, false, '1080p');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Telecamera Corridoio', 'Videosorveglianza', false, 5) RETURNING id_dispositivo INTO d_id;
  INSERT INTO videosorveglianza (id_dispositivo, registrazione_attiva, risoluzione) VALUES (d_id, true, '720p');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Telecamera Retro', 'Videosorveglianza', false, 6) RETURNING id_dispositivo INTO d_id;
  INSERT INTO videosorveglianza (id_dispositivo, registrazione_attiva, risoluzione) VALUES (d_id, true, '1080p');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Telecamera Terrazzo', 'Videosorveglianza', false, 7) RETURNING id_dispositivo INTO d_id;
  INSERT INTO videosorveglianza (id_dispositivo, registrazione_attiva, risoluzione) VALUES (d_id, true, '2K');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Telecamera Ingresso Pedonale', 'Videosorveglianza', false, 6) RETURNING id_dispositivo INTO d_id;
  INSERT INTO videosorveglianza (id_dispositivo, registrazione_attiva, risoluzione) VALUES (d_id, true, '1080p');

  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) 
  VALUES ('Telecamera Cantina', 'Videosorveglianza', false, 5) RETURNING id_dispositivo INTO d_id;
  INSERT INTO videosorveglianza (id_dispositivo, registrazione_attiva, risoluzione) VALUES (d_id, false, '720p');

  -- ===========================================================================
  -- 6. ALTRO (10 dispositivi, non necessitano di tabelle di specializzazione)
  -- ===========================================================================
  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) VALUES ('Presa TV', 'Altro', false, 1);
  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) VALUES ('Smart Plug Lavatrice', 'Altro', false, 2);
  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) VALUES ('Presa Macchina Caffè', 'Altro', false, 2);
  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) VALUES ('Presa Lavastoviglie', 'Altro', false, 2);
  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) VALUES ('Diffusore Audio', 'Altro', false, 15);
  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) VALUES ('Smart TV', 'Altro', false, 85);
  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) VALUES ('Purificatore Aria', 'Altro', false, 35);
  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) VALUES ('Deumidificatore', 'Altro', false, 320);
  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) VALUES ('Console Giochi', 'Altro', false, 150);
  INSERT INTO dispositivo (nome, tipo_dispositivo, stato_attuale, consumo_watt) VALUES ('Presa Ricarica', 'Altro', false, 5);

END $$;
