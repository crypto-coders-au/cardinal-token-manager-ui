import { unissueToken } from '@cardinal/token-manager'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { useWallet } from '@solana/wallet-adapter-react'
import type { TokenData } from 'api/api'
import { pubKeyUrl } from 'common/utils'
import { lighten } from 'polished'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import React from 'react'
import { FaEllipsisH } from 'react-icons/fa'
import { FiExternalLink, FiSend } from 'react-icons/fi'
import { IoClose, IoQrCodeOutline } from 'react-icons/io5'
import { getColorByBgColor } from 'rental-components/common/Button'
import { useQRCode } from 'rental-components/QRCodeProvider'
import { useRentalModal } from 'rental-components/RentalModalProvider'

import {
  MediaOuterStyle,
  NFTImageHeight,
  TokenMetadataStyle,
} from './CustomStyles'
import { NFTOverlay } from './NFTOverlay'
import { Popover, PopoverItem } from './Popover'
import { executeTransaction } from './Transactions'
import { asWallet } from './Wallets'

interface NFTProps {
  tokenData: TokenData
  fullyRounded?: boolean
  onClick?: () => void
}

export function NFT({ tokenData, onClick }: NFTProps) {
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  const { show } = useQRCode()
  const rentalModal = useRentalModal()
  const { config } = useProjectConfig()

  const {
    tokenAccount,
    metadata,
    tokenManager,
    timeInvalidator,
    useInvalidator,
  } = tokenData

  const elligibleForRent =
    !config.disableListing &&
    !tokenManager &&
    tokenAccount?.account.data.parsed.info.state !== 'frozen' &&
    tokenData.editionData

  return (
    <TokenMetadataStyle
      style={{
        background: lighten(0.02, config.colors.main),
      }}
      className="rounded-t-lg"
    >
      <Popover
        content={
          <div
            className="flex flex-col rounded-md px-1 py-1"
            style={{
              background: lighten(0.07, config.colors.main),
              color: getColorByBgColor(config.colors.main),
            }}
          >
            <PopoverItem>
              <a
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'white',
                }}
                href={pubKeyUrl(
                  tokenManager?.parsed.mint ??
                    tokenAccount?.account.data.parsed.info.mint,
                  ctx.environment.label
                )}
                target="_blank"
                rel="noreferrer"
              >
                View
                <FiExternalLink />
              </a>
            </PopoverItem>
            {!tokenManager && (
              <PopoverItem>
                <div
                  className={`${
                    elligibleForRent
                      ? 'cursor-pointer'
                      : 'cursor-default opacity-20'
                  } flex items-center justify-between gap-2`}
                  onClick={() => {
                    elligibleForRent &&
                      rentalModal.show(
                        asWallet(wallet),
                        ctx.connection,
                        ctx.environment.label,
                        [tokenData],
                        config.rentalCard
                      )
                  }}
                >
                  Rent
                  <FiSend />
                </div>
              </PopoverItem>
            )}
            {tokenManager?.parsed.issuer.toString() ===
              wallet.publicKey?.toString() && (
              <PopoverItem>
                <div
                  className="flex cursor-pointer items-center justify-between gap-2"
                  onClick={async () =>
                    tokenData?.tokenManager &&
                    executeTransaction(
                      ctx.connection,
                      asWallet(wallet),
                      await unissueToken(
                        ctx.connection,
                        asWallet(wallet),
                        tokenData?.tokenManager?.parsed.mint
                      ),
                      {
                        silent: true,
                      }
                    )
                  }
                >
                  Delist
                  <IoClose />
                </div>
              </PopoverItem>
            )}
            {tokenManager &&
              tokenManager.parsed.state === TokenManagerState.Claimed && (
                <PopoverItem>
                  <div
                    className="flex cursor-pointer items-center justify-between gap-2"
                    onClick={() =>
                      show(
                        ctx.connection,
                        asWallet(wallet),
                        tokenData,
                        ctx.environment.label
                      )
                    }
                  >
                    Scan
                    <IoQrCodeOutline />
                  </div>
                </PopoverItem>
              )}
          </div>
        }
      >
        <div
          // TODO fix this color
          className={`absolute top-[8px] right-[8px] z-50 flex cursor-pointer items-center justify-center rounded-full p-2 text-xl text-white hover:bg-[${lighten(
            0.3,
            config.colors.main
          )}]`}
          style={{
            transition: '0.2s all',
            background: lighten(0.07, config.colors.main),
          }}
          key={tokenAccount?.pubkey.toString()}
        >
          <FaEllipsisH />
        </div>
      </Popover>
      <MediaOuterStyle
        className={`z-0 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={() => {
          onClick ? onClick() : () => {}
        }}
      >
        {tokenManager && (
          <NFTOverlay
            state={tokenManager?.parsed.state}
            expiration={
              timeInvalidator?.parsed?.expiration?.toNumber() || undefined
            }
            durationSeconds={
              timeInvalidator?.parsed?.durationSeconds?.toNumber() || undefined
            }
            usages={useInvalidator?.parsed.usages.toNumber()}
            totalUsages={useInvalidator?.parsed.totalUsages?.toNumber()}
            lineHeight={14}
            stateChangedAt={
              tokenManager?.parsed.stateChangedAt?.toNumber() || undefined
            }
          />
        )}
        {metadata && metadata.data && (
          <img
            src={metadata.data.image}
            // src={customImageUri || metadata.data.image}
            alt={metadata.data.name}
            className={`${NFTImageHeight} rounded-t-lg`}
          />
        )}
      </MediaOuterStyle>
    </TokenMetadataStyle>
  )
}
