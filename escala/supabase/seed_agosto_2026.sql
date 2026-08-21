-- ============================================================================
--  SEED — Escala de AGOSTO/2026 (transcrita da escala oficial da CSCB).
--  Rode DEPOIS de schema.sql e policies.sql. Idempotente (pode rodar 2x).
-- ============================================================================

-- Grupos (unidades escaladas)
insert into public.grupos (nome)
select v.nome from (values ('AK Acústico'),('Aninha/Cristóvão'),('Banda Consagração'),('Cânticos de Maria'),('Célio Costa'),('Damília'),('Danilo e Aline'),('Gustavo e Germana'),('Isaac'),('Juliana e George'),('Levi'),('Lucas e Eglantine'),('Luz de Maria'),('Léo Deodato'),('Léo Oliveira'),('Maju'),('Marcelo Braga'),('Marcos Lessa'),('Marcílio e Will'),('Marjorie'),('Marquinhos'),('Matheus e Felipe'),('Mota Filho'),('Nayara'),('Nildeno'),('PH e Aline'),('PH e Luis'),('Rayan'),('Rennan e Filipe'),('Saulo e PH'),('Taís Cavalcante')) as v(nome)
where not exists (select 1 from public.grupos g where lower(g.nome)=lower(v.nome));

-- Uma pessoa por unidade (para os avisos alcançarem alguém — ajuste depois)
insert into public.pessoas (nome)
select v.nome from (values ('AK Acústico'),('Aninha/Cristóvão'),('Banda Consagração'),('Cânticos de Maria'),('Célio Costa'),('Damília'),('Danilo e Aline'),('Gustavo e Germana'),('Isaac'),('Juliana e George'),('Levi'),('Lucas e Eglantine'),('Luz de Maria'),('Léo Deodato'),('Léo Oliveira'),('Maju'),('Marcelo Braga'),('Marcos Lessa'),('Marcílio e Will'),('Marjorie'),('Marquinhos'),('Matheus e Felipe'),('Mota Filho'),('Nayara'),('Nildeno'),('PH e Aline'),('PH e Luis'),('Rayan'),('Rennan e Filipe'),('Saulo e PH'),('Taís Cavalcante')) as v(nome)
where not exists (select 1 from public.pessoas p where lower(p.nome)=lower(v.nome));

-- Vincula cada grupo à pessoa de mesmo nome
insert into public.grupo_membros (grupo_id, pessoa_id)
select g.id, p.id from public.grupos g
join public.pessoas p on lower(p.nome)=lower(g.nome)
where not exists (select 1 from public.grupo_membros gm where gm.grupo_id=g.id and gm.pessoa_id=p.id);

-- Escala do mês (publicada)
insert into public.escalas (ano, mes, versao, publicada, publicada_em)
values (2026, 8, 1, true, now())
on conflict (ano, mes) do update set publicada = excluded.publicada;

-- Itens da escala
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-01', '12:00', g.id, 'substituicao'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Cânticos de Maria')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-01', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Marquinhos')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-02', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Juliana e George')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-03', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Isaac')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-03', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Rayan')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-04', '12:00', g.id, 'substituicao'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('PH e Aline')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-04', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Cânticos de Maria')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-05', '12:00', g.id, 'substituicao'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Marcílio e Will')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-05', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Mota Filho')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-06', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Levi')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-06', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Nildeno')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-07', '12:00', g.id, 'substituicao'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Saulo e PH')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-07', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Marjorie')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-08', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Damília')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-08', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Célio Costa')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-09', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Banda Consagração')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-10', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Isaac')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-10', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Matheus e Felipe')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-11', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Danilo e Aline')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-11', '19:00', g.id, 'substituicao'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Cânticos de Maria')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-12', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Aninha/Cristóvão')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-12', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Marcos Lessa')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-13', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Levi')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-13', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Gustavo e Germana')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-14', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Léo Oliveira')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-14', '19:00', g.id, 'inversao'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Banda Consagração')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-15', '12:00', g.id, 'inversao'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Marjorie')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-15', '19:00', g.id, 'inversao'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Banda Consagração')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-16', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Marjorie')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-17', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Isaac')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-17', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('AK Acústico')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-18', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Danilo e Aline')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-18', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Cânticos de Maria')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-19', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Aninha/Cristóvão')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-19', '19:00', g.id, 'substituicao'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Nildeno')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-20', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Levi')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-20', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Nildeno')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-21', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Marcelo Braga')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-21', '19:00', g.id, 'inversao'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('PH e Luis')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-22', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Nayara')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-22', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Lucas e Eglantine')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-23', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Luz de Maria')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-24', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Isaac')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-24', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Matheus e Felipe')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-25', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Danilo e Aline')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-25', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Maju')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-26', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Aninha/Cristóvão')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-26', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Marcos Lessa')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-27', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Levi')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-27', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Rennan e Filipe')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-28', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Léo Oliveira')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-28', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('PH e Luis')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-29', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Léo Deodato')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-29', '19:00', g.id, 'inversao'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Taís Cavalcante')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-30', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Isaac')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-31', '12:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Isaac')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
insert into public.escala_itens (escala_id, data, horario, grupo_id, status)
select e.id, DATE '2026-08-31', '19:00', g.id, 'confirmada'::status_item
from public.escalas e join public.grupos g on lower(g.nome)=lower('Célio Costa')
where e.ano=2026 and e.mes=8
on conflict (escala_id, data, horario) do nothing;
