PGDMP      *                |         
   waste_data    16.4    16.4                0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false                       0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false                       1262    32976 
   waste_data    DATABASE     }   CREATE DATABASE waste_data WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_India.1252';
    DROP DATABASE waste_data;
                postgres    false            �            1259    41459    nodes    TABLE     �   CREATE TABLE public.nodes (
    node_id character varying(20) NOT NULL,
    type character varying(10) NOT NULL,
    lat double precision NOT NULL,
    long double precision NOT NULL,
    location character varying(100) NOT NULL
);
    DROP TABLE public.nodes;
       public         heap    postgres    false                       0    41459    nodes 
   TABLE DATA           C   COPY public.nodes (node_id, type, lat, long, location) FROM stdin;
    public          postgres    false    225   �       p           2606    41463    nodes nodes_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT nodes_pkey PRIMARY KEY (node_id);
 :   ALTER TABLE ONLY public.nodes DROP CONSTRAINT nodes_pkey;
       public            postgres    false    225                Q   x��56�5006��ᾜ��z&&&���z�&��n�ɥ9%�
���E%�E\ၨ:1tx�g�d*8��'gs��qqq ���     