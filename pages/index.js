import Image from 'next/image'
import { useState, useEffect } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import useSWR from 'swr';
import { request } from 'graphql-request';

export default function Home() {
  const [selected, setSelected] = useState([]);
  const [target, setTarget] = useState("")

  const onSubmit = (e) => {
    console.log(e)
    setTarget(e.target[0].value);
    e.preventDefault();
  }

  return (
    <Container>
      <Row>
        <Form onSubmit={onSubmit}>
          <Form.Group>
            <Form.Label>
              Target Tezos Address:
              <Form.Control type={'text'} placeholder={'Enter Tez Address of creator'}/>
            </Form.Label>
          </Form.Group>
          <Button type={'submit'}></Button>
        </Form>
      </Row>
      <DataMap target={target} />
    </Container>
  )
}

export function DataMap(props){
  const fetcher = query => request('https://data.objkt.com/v2/graphql', query);
  const { data, error } = useSWR(
  `{
    listing(where: {token: {creators: {creator_address: {_eq: ` + props.target + `}}, holders: {}}, status: {_eq: "active"}}, order_by: {token: {timestamp: asc}, price: asc}) {
      token {
        name
        display_uri
        timestamp
      }
      price
      status
      seller {
        address
        alias
      }
    }
  }`, fetcher)

  const onClick = (val) => (e) => {
    console.log(val);
  };

  if (props.target == '') return <div>No target.</div>
  if (error) {
    console.log(error);
    return <div>Failed to Load</div>;
  }
  if (!data) return <div>Loading...</div>;
  if (!error && data){
  return <Row>
    {data['listing'].map((el, i , arr) => {
      return <Col key={i} id={i} xs={4} sm={4} md={3} lg={2}>
        <Button id={i} variant={'outline-secondary'} onClick={onClick(el)}><StateImg src={'https://ipfs.io/ipfs/' + el['token']['display_uri'].slice(7,)}/>
        <h5>{el['token']['name']}</h5><p>{el['price'] / 1000000}</p></Button></Col>           
    })}
  </Row>;
  }
}

export function StateImg(props){
  const [width, setWidth] = useState('100%');
  const [height, setHeight] = useState('100%');
  return <Image height={height} width={width} alt=''
    src={props.src}
    onLoadingComplete={(obj)=>{
      setWidth(obj.naturalWidth);
      setHeight(obj.naturalHeight);
    }
  }></Image>
}