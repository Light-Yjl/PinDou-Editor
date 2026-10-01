export function mirrorImage(
  imageSrc:string
):Promise<string>{

  return new Promise(
    (resolve,reject)=>{

      const img=new Image()

      img.onload=()=>{

        const canvas=
          document.createElement('canvas')

        canvas.width=
          img.width

        canvas.height=
          img.height


        const ctx=
          canvas.getContext('2d')!


        // 水平镜像
        ctx.translate(
          img.width,
          0
        )

        ctx.scale(
          -1,
          1
        )


        ctx.drawImage(
          img,
          0,
          0
        )


        resolve(
          canvas.toDataURL(
            'image/png'
          )
        )

      }


      img.onerror=reject

      img.src=imageSrc

    }
  )

}